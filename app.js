const express=require('express');
const body_parser= require('body-parser');
const path=require('path')
const ejs=require('ejs');
const md5=require('md5');
const multer=require('multer');
const alert=require('alert')
const mongoose = require("mongoose");
const { read } = require('fs');
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://admin-team8:Team8-1234@cluster0.wg0pcti.mongodb.net/blogDB");
const upload=multer({
    storage:multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
});

const app=express();

app.use(express.static(__dirname+"/public"));
app.use(express.static(__dirname+"/uploads"))
app.use(body_parser.urlencoded({extended:false}));
app.set('view engine','ejs')

const blogSchema=new mongoose.Schema({
    id:String,
    title:String,
    image:String,
    content:String,
    views:Number
});
const productSchema= new mongoose.Schema({
    id:String,
    name:String,
    image:String,
    link: String,
    price:Number

});


const Blog=mongoose.model("Blog",blogSchema);

const Product=mongoose.model("Product",productSchema);

const userSchema= new mongoose.Schema({
        username:{type:String,required:[true,"You need a username"]},
        email:{type:String,required:[true,"You need a email"]},
        password:{type:String,required:[true,"You need a password"]},
        website:String,
        profession:String,
        fname:String,
        lname:String,
})

const User=mongoose.model('User',userSchema)

app.get('/',function(req,res){
    res.render('landing');
})




app.get('/register',function(req,res){
    res.render('login');
})

app.post('/login',function(req,res){
    const username1=req.body.username;
    const email=req.body.email;
    const user_password1=md5(req.body.password);
    User.findOne({username:username1,password:user_password1,email:email},function(err,docs) {
        if(!err){ 
            const main_id=docs._id;
            res.redirect('/home/'+main_id);
            
        }
        else{
            alert("You are not register or your password is wrong");
            res.redirect('/register')
        }
        
    })
})

app.post('/register',function(req,res){
    const username=req.body.username;
    const mail=req.body.email;
    const password=req.body.password;
    const password1=req.body.password2;
    User.find({email:mail},function(err,doc){
        if(err){
            console.log(err);
        }else{
            if(doc.length===0){
                if(password===password1){
                    const user=new User({
                        username:username,
                        email:mail,
                        password:md5(password)
                    })
                    user.save(function(err) {
                        if(err){
                            console.log(err);
                        }else{
                            console.log("Data is saved in the database");
                            res.redirect('/register')
                        }
                    })
                }else{
                    
                    alert("Your password doesn't match");
                }
            }else{
                alert("You are already register")
            }
            
        }
    })
    
})




    app.get('/home/:userId',function(req,res){
        const id1=req.params.userId;
        User.exists({_id:id1},function(err){
            if(err){
                res.redirect('/register');
            }else{
                Blog.find({},function(err,docs){
                    if(err){
                        console.log(err);
                    }else{
                        
                        Blog.count({},function(err,count){
                            if(count===0){
                                let max_blog={
                                    title:"Hello",
                                    image:"",
                                    content:"Welcome to our blogging platform",
                                    id:"",
                                }
                                res.render('home',{id:id1,data:docs,maxb:max_blog});
                            }
                            else{
                                Blog.find({}).sort({"views":-1}).limit(1).exec(function(err,doc){
                                    const max_blog={
                                        title:doc[0].title,
                                        image:doc[0].image,
                                        content:doc[0].content,
                                        id:doc[0]._id
                                    }
                                    res.render('home',{id:id1,data:docs,maxb:max_blog});
                                })
                            }
                        })
                        
                        
                    }
                })
            }
        })
    })
    
    app.get('/blog/:userId',function(req,res){
        const id=req.params.userId;
        User.exists({_id:id},function(err){
        if(err){
            res.redirect('/register');
        }else{
            Blog.find({id:id},function(err,docs){
                if(err){
                    console.log(err);
                }else{
                    Product.find({id:id},function(err,pdocs){
                        if(err){
                            console.log(err);
                        }else{
                            res.render('blog',{id:id,blogdata:docs,productdata:pdocs});
                        }
                    })
                }
            })
        }
    })    
    })
    
    app.get('/account/:userId',function(req,res){
        const id=req.params.userId;
        User.exists({_id:id},function(err){
            if(err){
                res.redirect('/register');
            }else{
                Product.find({id:id},function(err,pdocs){
                    if(err){
                        console.log(err);
                    }else{
                        Blog.find({id:id},function(err,blogs){
                            if(err){
                                console.log(err);
                            }else{
                                const blength=blogs.length;
                                const plength=pdocs.length;
                                var views=0;
                                blogs.forEach(function(view) {
                                    views=views+view.views;
                                });
                                User.findOne({_id:id},function(err,doc){
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.render('account',{id:id,plen:plength,blen:blength,view:views,udata:doc});
                                    }
                                })
                                
                            }
                        })
                        
                    }
            })
            }
        })
        
      
    })

    app.post('/account/:userId',function(req,res){
        const id=req.params.userId;
        const uvalue={
            fname:req.body.fname,
            lname:req.body.lname,
            email:req.body.mail,
            profession:req.body.profession,
            website:req.body.website  
        }
        
        User.findByIdAndUpdate({_id:id},uvalue,function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect('/account/'+id)
            }
        })
    })
    
    app.get('/create/:userId',function(req,res){
        const id=req.params.userId;
        User.exists({_id:id},function(err){
            if(err){
                res.redirect('/register');
            }else{
                Blog.find({id:id},function(err,docs){
                    if(err){
                        console.log(err);
                    }else{
                        const dic=docs;
                        res.render('create',{id:id,data:dic});
                    }
                })
            }
        })
      
    })
    
    app.get('/dashboard/:userId',function(req,res){
        const id=req.params.userId;
        User.exists({_id:id},function(err){
            if(err){
                res.redirect('/register');
            }else{
                Product.find({id:id},function(err,pdocs){
                    if(err){
                        console.log(err);
                    }else{
                        Blog.find({id:id},function(err,blogs){
                            if(err){
                                console.log(err);
                            }else{
                                const blength=blogs.length;
                                const plength=pdocs.length;
                                var views=0;
                                blogs.forEach(function(view) {
                                    views=views+view.views;
                                });
                                res.render('dashboard',{id:id,productdata:pdocs,plen:plength,blen:blength,view:views});
                            }
                        })
                        
                    }
                
            })
            }
        })
        
})
    
    app.get('/editor/:userId',function(req,res){
        res.render('editor',{id:req.params.userId}); 
    })

    app.get('/editor/edit/:userId/:blogId',function(req,res){
        const bid=req.params.blogId
        const userid=req.params.userId;
        Blog.findById({_id:bid},function(err,docs){
            if(err){
                console.log(err);

            }else{
                res.render('edit',{id:userid,bdata:docs});
            }
        })
    })

    app.post('/editor/edit/:userId/:blogId',upload.single('image'),function(req,res){
        const title1=req.body.title;
        const content1 =req.body.content;
        const image1 =req.file.filename;
        const id=req.body.custId;
        const bid=req.params.blogId;
        const blog1={
            id:id,
            title:title1,
            image:image1,
            content:content1,
            views:0,
        }
        Blog.findByIdAndUpdate({_id:bid},blog1,function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Data is updated");
                res.redirect('/create/'+id);
            }
        })
    })






    app.get('/editor/delete/:userId/:blogId',function(req,res){
        const bid=req.params.blogId
        const userid=req.params.userId;
        Blog.findByIdAndDelete({_id:bid},function(err){
            if(err){
                console.log(err);
            }else{
                console.log("Data is deleted");
                res.redirect('/create/'+userid);
            }
        })
    })
    
    app.post('/editor/:userId',upload.single('image'),function(req,res){
        const title1=req.body.title;
        const content1 =req.body.content;
        const image1 =req.file.filename;
        const id=req.body.custId;
        const blog1=new Blog({
            id:id,
            title:title1,
            image:image1,
            content:content1,
            views:0,
        })
        blog1.save(function(err){
            if(err){
                console.log(err)
            }else{
                console.log("Data is Saved")
                res.redirect('/test/'+id)
            }
        })
    })
    
    app.get('/products/:userId',function(req,res){
        res.render('products',{id:req.params.userId});
    })
    
    app.post('/products/:userId',upload.single('image'),function(req,res){
        const product_name=req.body.name;
        const product_link=req.body.link;
        const product_price=req.body.price;
        const product_image=req.file.filename;
        const product_id=req.body.custId;
        const product1=new Product({
            id:product_id,
            name:product_name,
            image:product_image,
            link:product_link,
            price:product_price
        });
        product1.save(function(err){
            if(err){
                console.log(err);
            }else{
                res.redirect('/test2/'+product_id);
            }
        });   
    })
    app.get('/product/delete/:userId/:productId',function(req,res){
        const id=req.params.userId;
        const productid=req.params.productId;
        Product.findByIdAndDelete({_id:productid},function(err){
            if(err){
                res.redirect('/home/'+id);
            }else{
                res.redirect('/dashboard/'+id);
            }
        })
    })
    
    app.get('/id/:userId/:blogId',function(req,res){
        const id1=req.params.userId;
        const bid=req.params.blogId;
        User.exists({_id:id1},function(err){
            if(err){
                res.redirect('/register');
            }else{
                Blog.findOne({_id:bid},function(err,docs){
                    if(err){
                        console.log(err);
                    }else{
                        Product.find({id:docs.id},function(err,dic){
                            if(err){
                                console.log(err);
                            }else{
                                const value=docs.views+1;
                                Blog.findByIdAndUpdate({_id:bid},{views:value},function(err,data){
                                    if(err){
                                        console.log(err);
                                    }else{
                                        res.render('id',{id:id1,bdata:docs,pdata:dic});
                                    }
                                })
                                
                            }
                        })
                    }
                })
            }
        })
    })

    app.post('/id/search/:userId',function(req,res){
        const id1=req.params.userId;
        const search_title=req.body.search_value;
        Blog.findOne({title:search_title},function(err,docs){
            if(err){
                res.redirect('/home/'+id1);
            }else{
                try {
                    Product.find({id:docs.id},function(err,dic){
                        if(err){
                            res.redirect('/home/'+id1);
                        }else{
                            res.render('id',{id:id1,bdata:docs,pdata:dic});
                        }
                    })
                } catch (error) {
                    res.redirect('/home/'+id1);
                } 
            }
        })
    })

    
    app.get('/test/:userId',function(req,res){
        const id =req.params.userId;

        Blog.find({id:id},function(err,docs){
            if(err)
            {
                console.log(err);
            }else{
                res.redirect('/create/'+id);
                // res.render('test',{item:docs});
            }
        })
        
    })
    
    app.get('/test2/:userId',function(req,res){
        const id=req.params.userId;
        Product.find({id:id},function(err,docs){
            if(err){
                console.log(err);
            }
            else{
                res.redirect('/create/'+id);

            }
        })
    })
    


app.listen(3000,function(){
    console.log("Server started at post 3000");
})