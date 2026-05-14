const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const COLLECTION_USERS = 'users'
const COLLECTION_CODES = 'verification_codes'

const CODE_EXPIRE_TIME = 5 * 60 * 1000
const SEND_INTERVAL = 60 * 1000
const DAILY_LIMIT = 10

exports.main = async (event, context) => {
  const { action } = event

  console.log('[CloudFunction] 登录云函数被调用, action:', action)

  switch (action) {
    case 'getOpenid':
      return await getOpenid(event)

    case 'sendCode':
      return await sendVerificationCode(event)

    case 'verifyCode':
      return await verifyCode(event)

    case 'wechatLogin':
      return await wechatLogin(event)

    case 'checkNickname':
      return await checkNickname(event)

    default:
      return {
        success: false,
        message: '未知操作类型'
      }
  }
}

async function getOpenid(event) {
  try {
    const wxContext = cloud.getWXContext()

    if (wxContext && wxContext.OPENID) {
      return {
        success: true,
        openid: wxContext.OPENID,
        unionid: wxContext.UNIONID || null
      }
    }

    return {
      success: false,
      message: '无法获取openid'
    }
  } catch (error) {
    console.error('[getOpenid] 错误:', error)
    return {
      success: false,
      message: '获取openid失败'
    }
  }
}

async function sendVerificationCode(event) {
  const { phone } = event

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return {
      success: false,
      message: '手机号格式不正确'
    }
  }

  const now = Date.now()

  try {
    const recentCodes = await db.collection(COLLECTION_CODES)
      .where({
        phone: phone,
        expireTime: _.gt(now)
      })
      .limit(1)
      .get()

    if (recentCodes.data && recentCodes.data.length > 0) {
      const lastSendTime = recentCodes.data[0].createTime
      if (now - lastSendTime < SEND_INTERVAL) {
        const remaining = Math.ceil((SEND_INTERVAL - (now - lastSendTime)) / 1000)
        return {
          success: false,
          message: `操作过于频繁，请${remaining}秒后再试`
        }
      }
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCountResult = await db.collection(COLLECTION_CODES)
      .where({
        phone: phone,
        createTime: _.gte(todayStart.getTime())
      })
      .count()

    if (todayCountResult.total >= DAILY_LIMIT) {
      return {
        success: false,
        message: '今日发送次数已达上限'
      }
    }

    const code = generateCode(6)

    await db.collection(COLLECTION_CODES).add({
      data: {
        phone: phone,
        code: code,
        createTime: now,
        expireTime: now + CODE_EXPIRE_TIME,
        used: false
      }
    })

    console.log(`[sendCode] 手机号 ${phone} 验证码已生成: ${code}`)

    const smsResult = await sendSMS(phone, code)

    if (smsResult.success) {
      return {
        success: true,
        message: '验证码发送成功'
      }
    } else {
      return {
        success: false,
        message: smsResult.message || '短信发送失败'
      }
    }
  } catch (error) {
    console.error('[sendCode] 错误:', error)
    return {
      success: false,
      message: '发送失败，请稍后重试'
    }
  }
}

function generateCode(length) {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

async function sendSMS(phone, code) {
  try {
    console.log(`[SMS] 模拟发送短信到 ${phone}: 验证码 ${code}`)

    return {
      success: true,
      message: '验证码发送成功（开发模式）'
    }
  } catch (error) {
    console.error('[SMS] 发送失败:', error)
    return {
      success: false,
      message: error.message || '短信服务异常'
    }
  }
}

async function verifyCode(event) {
  const { phone, code, openid } = event

  if (!phone || !code) {
    return {
      success: false,
      message: '手机号和验证码不能为空'
    }
  }

  try {
    const now = Date.now()

    const storedCodes = await db.collection(COLLECTION_CODES)
      .where({
        phone: phone,
        code: code,
        expireTime: _.gt(now),
        used: false
      })
      .limit(1)
      .get()

    if (!storedCodes.data || storedCodes.data.length === 0) {
      return {
        success: false,
        message: '验证码不存在或已过期'
      }
    }

    const storedData = storedCodes.data[0]

    await db.collection(COLLECTION_CODES).doc(storedData._id).update({
      data: {
        used: true
      }
    })

    const userInfo = await createOrUpdateUser({
      phone: phone,
      openid: openid,
      loginType: 'phone',
      nickname: `用户${phone.slice(-4)}`,
      avatar: '😊'
    })

    return {
      success: true,
      message: '登录成功',
      userInfo: userInfo
    }
  } catch (error) {
    console.error('[verifyCode] 错误:', error)
    return {
      success: false,
      message: '验证失败，请稍后重试'
    }
  }
}

async function wechatLogin(event) {
  const { code, userInfo: userProfile, openid } = event
  
  if (!code) {
    return {
      success: false,
      message: '微信授权code缺失'
    }
  }

  try {
    const wxContext = cloud.getWXContext()
    const finalOpenid = wxContext.OPENID || openid
    
    if (!finalOpenid) {
      throw new Error('无法获取微信openid')
    }

    console.log('[wechatLogin] openid:', finalOpenid)

    const userInfo = await createOrUpdateUser({
      openid: finalOpenid,
      loginType: 'wechat',
      nickname: userProfile ? userProfile.nickName : '微信用户',
      avatar: userProfile ? userProfile.avatarUrl : '😊',
      wxCode: code
    })

    return {
      success: true,
      message: '微信登录成功',
      openid: finalOpenid,
      userInfo: userInfo
    }
  } catch (error) {
    console.error('[wechatLogin] 错误:', error)
    return {
      success: false,
      message: error.message || '微信登录处理失败'
    }
  }
}

async function createOrUpdateUser(userData) {
  try {
    const existingUsers = await db.collection(COLLECTION_USERS)
      .where({
        openid: userData.openid
      })
      .limit(1)
      .get()

    const now = new Date()
    const updateData = {
      ...userData,
      updateTime: now,
      lastLoginTime: now,
      loginCount: _.inc(1)
    }

    if (existingUsers.data && existingUsers.data.length > 0) {
      const userId = existingUsers.data[0]._id
      
      await db.collection(COLLECTION_USERS).doc(userId).update({
        data: updateData
      })
      
      console.log('[createOrUpdateUser] 用户更新成功:', userId)
      
      return {
        _id: userId,
        ...existingUsers.data[0],
        ...updateData
      }
    } else {
      const newData = {
        ...userData,
        createTime: now,
        updateTime: now,
        lastLoginTime: now,
        loginCount: 1,
        status: 'active'
      }

      const addResult = await db.collection(COLLECTION_USERS).add({
        data: newData
      })
      
      console.log('[createOrUpdateUser] 新用户创建成功:', addResult._id)
      
      return {
        _id: addResult._id,
        ...newData
      }
    }
  } catch (error) {
    console.error('[createOrUpdateUser] 数据库操作失败:', error)

    return {
      tempId: 'temp_' + Date.now(),
      ...userData,
      createTime: new Date(),
      isTempUser: true
    }
  }
}

async function checkNickname(event) {
  const { nickname, excludeOpenid } = event

  if (!nickname || !nickname.trim()) {
    return {
      success: false,
      message: '昵称不能为空'
    }
  }

  const trimmedNickname = nickname.trim()

  try {
    let query = {
      nickName: trimmedNickname,
      status: 'active'
    }

    if (excludeOpenid) {
      query.openid = _.neq(excludeOpenid)
    }

    const res = await db.collection(COLLECTION_USERS)
      .where(query)
      .limit(1)
      .get()

    if (res.data && res.data.length > 0) {
      return {
        success: true,
        available: false,
        message: '该昵称已被使用'
      }
    } else {
      return {
        success: true,
        available: true,
        message: '该昵称可用'
      }
    }
  } catch (error) {
    console.error('[checkNickname] 错误:', error)
    return {
      success: false,
      message: '检查失败，请重试'
    }
  }
}
