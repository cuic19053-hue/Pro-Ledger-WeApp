/**
 * 微信小程序自动上传脚本
 * 使用 miniprogram-ci 库实现自动化上传
 * 
 * 使用方法：
 * 1. 安装依赖：npm install miniprogram-ci --save-dev
 * 2. 配置 project.config.json
 * 3. 运行：node scripts/upload.js
 */

const ci = require('miniprogram-ci')
const path = require('path')
const readline = require('readline')

const projectConfig = {
  appid: 'wx7746f093e68667ff',
  projectPath: path.resolve(__dirname, '..'),
  privateKeyPath: path.resolve(__dirname, 'private.key'),
  ignores: ['node_modules/**/*', 'tests/**/*', '*.md', '.git/**/*']
}

// 创建交互式输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * 上传小程序
 */
async function uploadMiniProgram(version, desc) {
  try {
    console.log('🚀 开始上传小程序...')
    console.log(`   版本号：${version}`)
    console.log(`   备注：${desc}`)
    
    const project = await ci.Project(projectConfig)
    
    const result = await ci.upload({
      project,
      version,
      desc,
      onProgressUpdate: (progress) => {
        console.log(`   上传进度：${progress}%`)
      },
      useEcmascript6: true,
      es6: true,
      es7: true,
      compileHotReLoad: false
    })
    
    console.log('✅ 上传成功！')
    console.log(`   上传结果：${JSON.stringify(result, null, 2)}`)
    
    return result
  } catch (error) {
    console.error('❌ 上传失败：', error)
    throw error
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 微信小程序自动上传工具 ===\n')
  
  // 获取版本号和备注
  rl.question('请输入版本号（如 1.0.0）：', async (version) => {
    rl.question('请输入版本备注：', async (desc) => {
      try {
        await uploadMiniProgram(version, desc)
        console.log('\n🎉 上传完成！')
        console.log('请前往微信公众平台提交审核：https://mp.weixin.qq.com')
      } catch (error) {
        console.error('\n💥 上传失败，请检查错误信息')
        process.exit(1)
      } finally {
        rl.close()
      }
    })
  })
}

// 运行主函数
main()
