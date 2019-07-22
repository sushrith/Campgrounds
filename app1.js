var express=require("express"),
app=express(),
bodyParser=require("body-parser"),
comment =require("./models/comments"),
image= require("./models/image.js"),
user=require("./models/user"),
PORT= process.env.PORT || 3000,
mongoose=require("mongoose");
var request = require("request"),
flash=require("express-flash-messages"),
passport=require("passport"),
methodOverride=require("method-override"),
LocalStrategy=require("passport-local"),
passportLocalMongoose=require("passport-local-mongoose");

//seedDB();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public")); 
app.use(methodOverride("_method"));
app.use(flash());

//passport configuration
app.use(require("express-session")({
    secret:"Sushrith is a good boy",
    resave:false, 
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.message = req.flash("error");
    next();
    });

//mongoose.connect("mongodb://localhost:27017/gallery",{useNewUrlParser:true}).then(()=>{console.log("database connected..")}).catch(err=>{throw err});
mongoose.connect("mongodb+srv://sushrith:sushrith@yelpcamp-l8gok.mongodb.net/test?retryWrites=true&w=majority");
app.get("/",(req,res)=>{
    res.render("landing.ejs"); 
}); 


//[INDEX] ROUTE
app.get("/campgrounds",(req,res)=>{

    image.find({},function(err,x){
        if(err){
            console.log("went wrong");
        }else{
            
            res.render("index.ejs",{campgrounds:x});
            
        }
    }); 
});

//ADD A NEW ITEM TO DB BY A  FORM [NEW]
app.get("/campgrounds/new",isLoggedIn,(req,res)=>{

    res.render("new.ejs");
});

//[CREATE] ROUTE IN A DB
app.post("/campgrounds/new1",isLoggedIn,(req,res)=>{

var x = req.body.name;
var p =req.body.price;
var y = req.body.image;
var z = req.body.description;
var author={
    id:req.user._id,
    username:req.user.username
}
var sushi= new image({
    name:x,
    image:y,
    description:z,
    author :author,
    price:p
});
sushi.save(function(err,x){
    if(err){
        console.log("went wrong");
    }else{
        
      console.log("inserted Sucessfully");
    }
}); 
 res.redirect("/campgrounds");    
});

//SHOW PAGE
app.get("/campgrounds/:id",(req,res)=>{
    image.findById(req.params.id).populate("comments").exec((err,found)=>{
        if(err) throw err;
        else{
            //console.log(found);
            res.render("show.ejs",{found:found});

        }
    });
});


app.get("/campgrounds/:id/commentform",isLoggedIn,(req,res)=>{
    image.findById(req.params.id,function(err,image){
    if(err) throw err;
        else{
            res.render("commentsform.ejs",{x:image,y:req.params.id});
    }
    });
    });    
    
    //post for a comment(create)
    app.post("/campgrounds/:id/commentform",isLoggedIn,(req,res)=>{
    image.findById(req.params.id,function(err,image){
        if(err) throw err;
        else{
            comment.create(req.body.x,function(err,comment){
                if(err) throw err;
                else{
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    image.comments.push(comment);
                    image.save(function(err,data){
                        if(err) throw err;
                        else{
                            
                            res.redirect("/campgrounds/"+req.params.id);
                        }
                    });
                }
            });
        }
    });
    });

    
//Signup
app.get("/signup",(req,res)=>{

    res.render("signup.ejs");
});
app.post("/signup",(req,res)=>{
user.register(new user({username:req.body.username}),req.body.password,function(err,user){
    if(err){
        console.log(err);
        return res.render("signup.ejs");
    }else{
        passport.authenticate("local")(req,res,function(){
                res.redirect("/campgrounds");
        });
    }

});
});
//LOGIN
app.get("/login",(req,res)=>{

    res.render("login.ejs",{message:req.flash("error")});
});
app.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"
}),(req,res)=>{
});

//logout
app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

//Edit campground
app.get("/campgrounds/:id/edit",(req,res)=>{

     if(req.isAuthenticated()){
        image.findById(req.params.id,function(err,image){
            if(err) res.redirect("back");
            else{
             
                if(image.author.id.equals(req.user._id) ){
                res.render("editimage.ejs",{image:image});
                }else{
                    
                    res.redirect("back");
                }
            }
        });
     }else{
         res.redirect("/login");
     }
 
    });
//update campground
app.put("/campgrounds/:id/edit",ownership,(req,res)=>{

image.findByIdAndUpdate(req.params.id,req.body.image,function(err,updated){
if(err) res.redirect("/camgrounds/" + req.params.id);
else{
    res.redirect("/campgrounds/" + req.params.id );
}
});
}); 

//delete 
app.delete("/:id",ownership,(req,res)=>{
image.findByIdAndRemove(req.params.id,function(err){
    if(err) res.redirect("/campgrounds"); 
    else{
        res.redirect("/campgrounds");
    }
});

});

//Edit a comment
app.get("/campgrounds/:id/:cid/coom",commentownership,(req,res)=>{
comment.findById(req.params.cid,(err,txt)=>{
    var x={cid:req.params.cid,id:req.params.id};
    if(err) throw err;
    else{  
       res.render("editcomment.ejs",{txt:txt,x:x});
        
    }
});
});


//put a comment
app.put("/:id/:cid/editcomment",commentownership,(req,res)=>{
    
    comment.findByIdAndUpdate(req.params.cid,req.body.x,function(err,updated){
        if(err) res.redirect("/camgrounds/" + req.params.id);
        else{
            res.redirect("/campgrounds/" + req.params.id );
        }
        });
});

//delete comment
app.delete("/delete/:cid/:id",commentownership,(req,res)=>{

comment.findByIdAndRemove(req.params.cid,function(err){
    if(err) res.redirect("/campgrounds/"+req.params.id); 
    else{
        res.redirect("/campgrounds/"+req.params.id);
    }

});    

});

function isLoggedIn(req,res,next){
if(req.isAuthenticated()){
    return next();
}
req.flash("error","Please Login First");
res.redirect("/login");
}

function ownership(req,res,next){
if(req.isAuthenticated()){
        image.findById(req.params.id,function(err,image){
            if(err) res.redirect("back");
            else{
                if(image.author.id.equals(req.user._id)){
                next();
                }else{
                    res.redirect("back");
                }
            }
        });
     }else{
         res.redirect("/login");
     }
}

function commentownership(req,res,next){
    if(req.isAuthenticated()){
        comment.findById(req.params.id,function(err,comment){
            
            if(err) res.redirect("back");
            
                if(comment.author.id.equals(req.user._id)){
                
                    next();
                }else{
                    res.redirect("back");
                }
            });
    
     }else{
         res.redirect("/login");
     } 
}


app.listen(PORT,function(err){
    if(err) throw err;
    else{
    console.log("connected.....");
    }
});