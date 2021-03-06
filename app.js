require('dotenv').config()
const moment = require('moment');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
var flash = require("connect-flash");
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy=require('passport-local');
const app = express();
const multer = require('multer');
const middleware = require("./middleware");
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');

cloudinary.config({ 
  cloud_name: 'detmssa1y', 
  api_key: process.env.DB_KEY, 
  api_secret: process.env.DB_SECRET
});


app.use(methodOverride("_method"));
app.use(flash());
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public")); 
app.use(bodyParser.urlencoded({extended:true}));
mongoose.set('useUnifiedTopology', true);

//mongoose.connect('mongodb://localhost:27017/share_movie', { useNewUrlParser: true });
mongoose.connect(process.env.DB_LINK, {
	 useNewUrlParser: true,
	 useCreateIndex: true
	 }).then(()=>{
		 console.log("DB connected");
	 }).catch(err =>{
		 console.log("Error",err.message);
	 });

app.set("view engine","ejs");
const Comment = require("./models/comment")
const User= require("./models/user");
const Picture= require("./models/picture");
app.use(require("express-session")({
	secret: "Movie",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req,res,next){ //passes current usr to every template
    res.locals.currentUser=req.User;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});



app.get("/",function(req,res){
    
    
    User.find({"username": {$exists: true}},function(err,foundUser){
        if(err)
        console.log(err);
        else{
            res.render("landing",{
                currentUser:req.user,
                User:foundUser
            });
        }
    })
    
});
app.get("/login",function(req,res){
    res.render("login",{
		currentUser:req.user
	});
});
app.post("/login",passport.authenticate("local",
 {
	 successRedirect:"/",
	 failureRedirect:"/login",
     failureFlash: true
}), function(req,res){
	
});


app.get("/register",function(req,res){
    res.render("register",{
		currentUser:req.user
	});
});
app.post("/register",upload.single('image'),function(req,res){

    User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
            
            if(!req.file){
                console.log("No file");
                req.body.image = "https://png.pngtree.com/png-vector/20190710/ourmid/pngtree-user-vector-avatar-png-image_1541962.jpg";
                User.findById(req.user.id,function(err,founduser){
                    if(founduser){
                        founduser.image=req.body.image;
                        founduser.save(function(){
                            req.flash("success","Welcome to ShareMe "+ user.username);
                            res.redirect("/");
                        });
                    }
                    
                });
            }else{
                  cloudinary.uploader.upload(req.file.path,function(result){
       
                    req.body.image = result.secure_url;
                    console.log(result.secure_url);
            
     
                User.findById(req.user.id,function(err,founduser){
                    if(founduser){
                        founduser.image=req.body.image;
                        founduser.save(function(){
                            req.flash("success","Welcome to ShareMe "+ user.username);
                            res.redirect("/");
                        });
                    }
                    
                });
            });

                console.log(req.body.image);
               // res.redirect("/");
            
            }
		});
	});
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

app.get("/image/new",middleware.isLoggedIn,function(req,res){
    res.render('new_image');
});

app.post("/image/new",middleware.isLoggedIn,upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path, function(result){
        req.body.image = result.secure_url;
    
    const title=req.body.title;
	const description=req.body.description;
	const image = req.body.image;
	const author = {
		id:req.user._id,
		username:req.user.username
    }; 	
    var newPicture={
		title: title, image:image, description:description , author:author 
	};
	
	Picture.create(newPicture,function(err,newlyCreated){
		if(err)	
			console.log("error");
		else{
			req.flash("success","Image Added!");
            res.redirect("/image/"+req.user._id);
            console.log(newlyCreated);
		}
											  });
                                            });

});

app.get("/image/:id",function(req,res){
    User.findById(req.params.id,function(err, foundUser){
        if(err||foundUser==null){
            req.flash("error","Link not found");
            res.redirect("/");
        }else{
            var images ;
       // var user = "" + foundUser.username;
          Picture.find({
           
            
        },function(err,found){
            images = [];
            if(err){
                console.log(err);
                // req.flash("error","Link not found");
            }
            
            found.forEach(function(image,index){
                
                if(image.author.username===foundUser.username){
                   // console.log(image.author.username+"="+foundUser.username);
                    images.push(image);

                }else{
                    found.slice(index,1);
                    console.log(image);
                }
            });
            
            res.render("gallery",{
                images:images,
                User:foundUser,
                currentUser:req.user
            });
        });
     
        }
        
    });
    
});

app.get("/image/:userid/current/:imageid",middleware.isLoggedIn, function(req,res){
    Picture.findById(req.params.imageid).populate("comments likes").exec(function(err,found){
        if(err||found==null){
            console.log(err);
            req.flash("error","Err");
            res.redirect("/");
        }
        
        else{
            console.log(found);
            User.findById(req.params.userid,function(err,foundUser){
                 if(err||foundUser==null){
                        req.flash("error","Link not found");
                        res.redirect("/");
                 }else{
                    res.render("show",{
                        image:found,
                        currentUser:req.user,
                        user:foundUser,
                        moment:moment
                    });
                 }
                
            });

           
        }
    })
    
});
app.delete("/image/:userid/current/:id",middleware.checkOwnership,function(req,res){
    Picture.findByIdAndRemove(req.params.id,function(err){
        if(err){
            req.flash("error",err.message);
            res.redirect("/");
        }else{
            req.flash("success","Image deleted");
            res.redirect("/image/"+req.params.userid);
        }
    })
});
app.get("/image/:userid/current/:id/edit",middleware.checkOwnership,function(req,res){
    Picture.findById(req.params.id,function(err,picture){
        res.render("update_image",{
            currentUser:req.user,
            image:picture
        });
    });

});
app.put("/image/:userid/current/:id",middleware.checkOwnership,function(req,res){
    Picture.findByIdAndUpdate(req.params.id,req.body.image,function(err , updatePicture){
		if(err)
		res.redirect("/");
		else{
			req.flash("success","Image updated");
			res.redirect("/image/" + req.params.userid);
			
		}
	});	
});

app.post("/image/:userid/current/:id/like",middleware.isLoggedIn,function(req,res){
    Picture.findById(req.params.id, function (err, foundImage) {
        if (err) {
            console.log(err);
            return res.redirect("/");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundImage.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundImage.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundImage.likes.push(req.user);
        }

        foundImage.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/");
            }
            return res.redirect("/image/"+req.params.userid+"/current/" + foundImage._id);
        });
    });

});
//COMMENTS

app.post("/image/:userid/current/:id/comment",middleware.isLoggedIn, function(req,res){
    Picture.findById(req.params.id,function(err,image){
		if(err){
			console.log(err);
			res.redirect("/");
		}
		else{
			Comment.create(req.body.comment,function(err,comment){
				if(err){
                    req.flash("error","Something went wrong");
                    res.redirect("/");
                }
					
				else{
					//add username and id
					comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.author.image = req.user.image;
					//console.log(req.user.username);
					comment.save();
					//console.log(comment.author+" ");
					image.comments.push(comment);
					image.save();
					req.flash("success","Succesfully added comment");
					res.redirect("/image/"+req.params.userid+"/current/"+req.params.id);
				}
			});
		}
	});
});
app.put("/image/:userid/current/:id/comment/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment)
	{
		if(err)
		res.redirect("back");
		else{
			req.flash("success","Comment edited");
			res.redirect("/image/"+req.params.userid+"/current/"+req.params.id);
		}
		
	});
});
app.delete("/image/:userid/current/:id/comment/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndDelete(req.params.comment_id,function(err){
		if(err)
		res.redirect("back");
		else{
			req.flash("success","Comment deleted");
			res.redirect("/image/"+req.params.userid+"/current/"+req.params.id);
		}
	})
});

app.get("/*",function(req,res){
  //  req.flash("error","Link not found");
    res.redirect("/")
})

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});