
app.get('/', function(req,res){
	res.render('index');
});

app.get('/articles', function(req,res){
	Article.find({}, function(err, doc){

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
				console.log("these are my comments",doc)
				res.render('comments', doc);
				console.log(doc);
			}
		});
});

app.post('/articles/:id', function(req, res){

	var newComment = new Comment(req.body);


	newComment.save(function(err, doc){

		
		if(err){
			console.log("ERROR SAVING: ",err);
		} 

		else {
			Article.findOneAndUpdate({'_id': req.params.id}, {'comments':doc._id})
			.exec(function(err, doc){

				if (err){
					console.log(,err);
				} else {
					
					Article.findOne({'_id': req.params.id})
						.populate('comments')
						.exec(function(err,doc){
							if(err){
								console.log(err);
							}
							else{
								console.log("these are my comments",doc)
								res.render('comments', doc);
							}
						});
					
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

				result.title = $(this).children('article').children('figure').children('a').children('img').attr('alt');

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