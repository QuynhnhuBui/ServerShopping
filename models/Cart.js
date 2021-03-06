const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cartDetail = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    auto: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    require: true
  },
  productName: {
    type: String,
    require: true
  },
  typeProduct: {
    type: String,
    require: true
  },
  productImg: {
    type: String,
    require: false
  },
  unit: {
    type: String,
    require: true
  },
  quan: {
    type: Number,
    require: true
  },
  price: {
    type: String,
    require: true
  },
  status: {
    type: Number,
    enum: [0, 1]
  },
  created_at: {
    type: Date,
    require: true
  },
  delete_at: {
    type: Date,
    timezone: "Asia/Ho_Chi_Minh",
  },
  last_modified: {
    type: Date,
    default: Date.now
  },
})

const cartSchema = new Schema({
  _id: {
    type: Schema.Types.ObjectId,
    required: true,
    // default: new ObjectId()
  },
  cartDetail: [cartDetail],
  total: {
    type: String,
  },
  quanti: {
    type: Number,
    default: 0
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  created_at: {
    type: Date,
    timezone: "Asia/Ho_Chi_Minh"
  },
  delete_at: {
    type: Date,
    default: null,
    timezone: "Asia/Ho_Chi_Minh"
  },
  last_modified: {
    type: Date,
    default: Date.now,
    timezone: "Asia/Ho_Chi_Minh"
  }
})

const Cart = mongoose.model('Cart', cartSchema, 'Cart')

module.exports = Cart