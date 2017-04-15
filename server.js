var express = require('express');
var app = express();

var request = require('request');
var cheerio = require('cheerio');

var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2'
var url = 'http://www.newyorker.com/popular?intcid=mod-most-popular'



var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static(process.cwd() + '/public'));
var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


mongoose.connect('mongodb://heroku_qvzw8sgz:v1di6ungt5ckubs14r7uem4ltn@ds161190.mlab.com:61190/heroku_qvzw8sgz');
var db = mongoose.connection;


db.on('error', function(err){
	console.log('Mongoose Error: ' + err);
});


db.once('open', function(){
	console.log('Mongoose connection a success!');
});


var Article = require('./models/articles.js');
var Comment = require('./models/comments.js');


app.get('/', function(req,res){
	res.render('index');
});

app.get('/articles', function(req,res){
	Article.find({})
		.sort({'date': -1})
		.limit(30)
		.exec(
			function(err, doc){
				
				if (err){
					console.log(err);
				} 
					else {
					res.json(doc);
				}
			});
	});

app.get('/articles/:id', function(req,res){
	Article.findOne({'_id': req.params.id})
		.populate('comments')
		.exec(function(err,doc){
			if(err){
				console.log(err);
			}
			else{
				console.log("Comment box",doc);
				res.render('comments', doc);
				
			}
		});
});

app.post('/articles/:id', function(req, res){
		var newComment = new Comment(req.body);

		newComment.save(function(err, doc){
	
		if(err){
			console.log(err);
		} 
	
		else {
	
			Article.findOneAndUpdate({'_id': req.params.id}, {$push: {'comments':doc._id}}, {new: true, upsert: true})
				.populate('comments')
				.exec(function(err, doc){
					console.log("COMMENTS", doc)
	
					if (err){
						console.log(err);
					} else {
						res.render('comments', doc);
					}
			});
		}
	});

});


app.get('/scrape', function(req,res){
	
	var scrapePage = function(error, response, html){
		if (error || response.statusCode != 200){
			console.log(error);
		}
		else{
			var result = {};
			var $ = cheerio.load(html);

			$('.popular-page1').each(function(i, element){

				result.title = $(this).children('article').children('span').find('a').text();

				result.img_url = $(this).children('article').children('figure').children('a').children('img').attr('src');

				result.link = $(this).children('article').children('figure').children('a').attr('href');

				result.author = $(this).children('article').children('.text').children('h3').children('a').text();

				result.author_url = $(this).children('article').children('.text').children('h3').children('a').attr('href');;

				var entry = new Article(result);

					entry.save(function(err,doc){
						if(err){
							console.log(err);
						}
						else{
							console.log(doc);
						}

					});

				
			});
		}
	}

	request(
		{
			url: url,
			headers: {
				"User-Agent" : ua
			}
		}, scrapePage
	);

	res.redirect("/");
});

var PORT = process.env.PORT || 3000
app.listen(PORT, function(){
	console.log("Listening at Port " + PORT)
});