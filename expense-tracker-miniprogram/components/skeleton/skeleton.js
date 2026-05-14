Component({
  properties: {
    show: {
      type: Boolean,
      value: true
    },
    type: {
      type: String,
      value: 'list'
    },
    count: {
      type: Number,
      value: 3
    },
    showHeader: {
      type: Boolean,
      value: true
    },
    showAvatar: {
      type: Boolean,
      value: true
    },
    showTitle: {
      type: Boolean,
      value: true
    },
    showSubtitle: {
      type: Boolean,
      value: true
    },
    showAmount: {
      type: Boolean,
      value: false
    },
    showBlock: {
      type: Boolean,
      value: false
    },
    animated: {
      type: Boolean,
      value: true
    }
  },

  data: {},

  lifetimes: {
    attached() {}
  },

  methods: {}
})
