var mongoose=require("mongoose");
var pictureSchema= new mongoose.Schema({
	title:String,
	image:String,
	description:String,
	createdAt: { type: Date, default: Date.now },
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	}
});
module.exports =mongoose.model("Picture", pictureSchema);