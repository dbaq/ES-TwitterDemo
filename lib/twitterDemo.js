$(function(){

	var filters = { "match_all" : { } };
	var query = { "match_all" : { } };
	var es_from = 0;
	var es_size = 10;
	var sES = "http://localhost:9200/"; 


	//launch new query if the user types a new search
	$( "#searchterm" ).keyup (function(event) { 
				launchESQuery($(this).val());
				return true; 
	});
	$( "#searchterm" ).trigger('keyup');



	function launchESQuery(searchedValue){ 
		makeRequest(searchedValue,""); 
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

	}

});
