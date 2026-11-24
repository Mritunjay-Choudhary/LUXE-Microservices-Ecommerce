import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    // One active refresh token per account keeps logout and rotation simple.
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(_document, user) {
    delete user.passwordHash;
    delete user.refreshTokenHash;
    delete user.__v;
    return user;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
