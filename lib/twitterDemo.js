$(function(){

	var filters = { "match_all" : { } };
	var query = { "match_all" : { } };
	var es_from = 0;
	var es_size = 10;
	var sES = "http://localhost:9200/"; 
	var $tweetsTable = $("#clients");
	var $tweetsTableResultPosition = $("#resultPosition");
	var $searchTermInput = $( "#searchterm" );

	//launch new query if the user types a new search
	$searchTermInput.keyup (function(event) { 
				launchESQuery();
				return true; 
	});
	$searchTermInput.trigger('keyup');



	function launchESQuery(){ 
		makeRequest($searchTermInput.val(),""); 
	}
 

	/*function generateQuery(searchedValue, type) {
		switch(type) {
			case "wildcard":
				query = { "wildcard" : { "_all" : searchedValue } };
				break;

			case "query_string":
				query = { "query_string" : { "query" : searchedValue } };
				break;

			case "text":
				query = { "text" : { "_all" : searchedValue } };
				break;

			case "prefix":
				query = { "prefix" : { "_all" : searchedValue } };
				break;

			default:
				query = { "match_all" : { } };

		}
	}
*/



	function makeRequest(searchedValue, searchtype) {
		//generateQuery(searchedValue, searchtype);
		var esCall = JSON.stringify({
			"from" : es_from, "size" : es_size,
			"sort" : [
				"_score",
				{ "created_at" : {"order" : "desc"} }
				],
			"query" : { 
				"filtered" : {
					"query" : query,
					"filter" : filters
					}
				},
			"facets":{
				"text" : { "terms" : {"field" : "text", "size" : 5} },
				"tweeters" : { "terms" : {"field" : "user.screen_name", "size" : 5} },
				"hashtags" : { "terms" : {"field" : "hashtag.text", "size" : 5} },
				"mention" : { "terms" : {"field" : "mention.screen_name", "size" : 5} }
				}
		            }, null, 2);
	 
	   
		$.ajax({   url: sES + '/devoxx/_search?pretty=true'
		     	, type: 'POST'
		     	, data : esCall
		     	, dataType : 'json'
		     	, processData: false
		     	, success: function(json, statusText, xhr) {
				display(json);
		       }
		     , error: function(xhr, message, error) {
			   console.error("Error while loading data from ElasticSearch", message);
		      }
		});
	}


	function display(json){

		console.log(json);

		//DISPLAYING TWEETS
 		$tweetsTable.find("> tbody tr").remove();

                if(json != null && json.hits != null && json.hits.hits != null && json.hits.hits.length > 0){
			
			for(var i=0; i <= json.hits.hits.length; i++){
                            var hit = json.hits.hits[i];
                            if(hit){
                                var rowHtml = '<tr detail-num=' + i + ' style="cursor:pointer;">'
                                            + '<td>' + hit._source.created_at + '</td>' 
                                            + '<td>' + hit._source.user.screen_name + '</td>'
                                            + '<td>' + hit._source.text + '</td>'
                                            + '<td>' + hit._score + '</td></tr>'
                                var row = $(rowHtml);
                                row.click(function() {
                                    var detailNum = $(this).attr("detail-num");
                                    if(detailNum) {
                                        $('#detail .modal-body').html("<pre>" + JSON.stringify(json.hits.hits[detailNum], null, 2) + "</pre>");
                                        $('#detail').modal('show');
                                    }
                                });
				
                                $tweetsTable.find('tbody').append(row);
                            }
                        }
			$tweetsTableResultPosition.html((es_from+1) + " to " + (es_from + es_size) + " over a total of " + json.hits.total + " tweets")
				
                  }
		//END DISPLAYING TWEETS

 


	}


	//RESULTS NAVIGATION
	$( "#previous" ).click(function(event) {
		event.preventDefault();
		if (es_from > 9) es_from -= 10;
		launchESQuery();
	});
		
	$( "#next" ).click(function(event) {
		event.preventDefault();
		es_from += 10;
		launchESQuery();
	});
		 

});
