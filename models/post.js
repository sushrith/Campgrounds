var mongoose =require("mongoose");
var postSchema=new mongoose.Schema({
    title:String,
    content :String 
  })
  module.exports = mongoose.model("post",postSchema);