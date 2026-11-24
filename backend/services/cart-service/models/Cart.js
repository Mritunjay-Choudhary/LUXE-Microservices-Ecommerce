import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, max: 999 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // Auth owns user records; Cart stores only the ID and never reads Auth's database.
    userId: { type: String, required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
