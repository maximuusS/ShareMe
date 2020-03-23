var Picture = require("../models/picture");
//var Comment = require("../models/comment");

var middlewareObj={};
// all middlr
middlewareObj.checkOwnership = function(req,res,next){

    
        if(req.isAuthenticated()){
            //does usr owns it
            
            Picture.findById(req.params.id,function(err, foundImage){
               
                    if(err || !foundImage){
                        req.flash("error","Image not found");
                       
                        res.redirect("back");
                    }
                    
                    else{
                        //console.log(foundCamp.name);
                        if(foundImage.author.id.equals(req.user._id)){
                            next();
                        }else{
                            req.flash("error","You are not authenticated!");
                            res.redirect("/"); //go to backpage
                        }
                        
                }
            });
        }else{
            req.flash("error","You need to be logged in to do that!");
            res.redirect("/");
        }
}

// middlewareObj.checkCommentOwnership = function(req,res,next){
// 	if(req.isAuthenticated()){
// 		//does usr owns it
		
// 		Comment.findById(req.params.comment_id,function(err, foundComment){
             
// 				if(err || !foundComment){
// 					req.flash("error","Comment not found");
// 					res.redirect("back");
// 				}
				
// 				else{
// 					//console.log(foundCamp.name);
// 					if(foundComment.author.id.equals(req.user._id)){
// 						next();
// 					}else{
//                         req.flash("error","You dont have permission to do that");
// 						res.redirect("back"); //go to backpage
// 					}
					
// 			}
// 		});
// 	}else{
//         req.flash("error","You need to be logged in to do that");
// 		res.redirect("back");
// 	}
// }

middlewareObj.isLoggedIn= function(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}else{
       req.flash("error", "You need to be logged in to do that!");
		res.redirect("/login");
	}
}

module.exports = middlewareObj;