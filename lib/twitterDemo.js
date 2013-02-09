$(function(){

	var filters = { "match_all" : { } };
	var query = { "match_all" : { } };
	var es_from = 0;
	var es_size = 10;
	var sES = "http://localhost:9200/"; 
	var $tweetsTable = $("#clients");
	var $tweetsTableResultPosition = $("#resultPosition");
	var $searchTermInput = $( "#searchterm" );
	var $searchTweetersFilter = $("#searchTweeters");
	var $searchTrendsFilter = $("#searchTrends"); 

	//launch new query if the user types a new search
	$searchTermInput.keyup (function(event) { 
				launchESQuery();
				return true; 
	});
	$searchTermInput.trigger('keyup');



	function launchESQuery(){ 
		var searchedValue = $searchTermInput.val() ;
		if(searchedValue != "")
			query = { "query_string" : { "query" : searchedValue } };
		else
			query = { "match_all" : { } };
		makeRequest(searchedValue); 
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



	function makeRequest(searchedValue) {
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
				//"text" : { "terms" : {"field" : "text", "size" : 5} },
				"tweeters" : { "terms" : {"field" : "user.screen_name", "size" : 5} },
				"hashtags" : { "terms" : {"field" : "hashtag.text", "size" : 5} },
				//"mention" : { "terms" : {"field" : "mention.screen_name", "size" : 5} }
				}
		            }, null, 2);
	 
	   	$("#jsonRequest").html(esCall);

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
		else{
			var rowHtml = '<tr"><td colspan="4">No tweets found</td></tr>';
                        var row = $(rowHtml);
                        $tweetsTable.find('tbody').append(row);
			$tweetsTableResultPosition.html("oops");
		}
		//END DISPLAYING TWEETS


 		//DISPLAYING TWEETERS FACETS
		$searchTweetersFilter.find("li.facetTweeters").remove();
		if(json != null && json.facets != null && json.facets.tweeters != null && json.facets.tweeters.terms.length > 0){
			$searchTweetersFilter.find("li.facetTweeters").remove();
			for(var i = 0; i <= json.facets.tweeters.terms.length -1; i++){
				var term = json.facets.tweeters.terms[i];
 				var liHtml = '<li class="facetTweeters"> '+
					    	 '<a href="">' +term.term+'</a> ('+term.count+')'+
					     '</li>';
                                var li = $(liHtml);
				$searchTweetersFilter.append(li);
			}
		}
		$searchTweetersFilter.find("li.facetTweeters").each(function(){
			$(this).find('a').click(function(ev){
				ev.preventDefault();
				addFilter("user.screen_name",$(this).text());
				launchESQuery();
			});
		});
		//END DISPLAYING TWEETERS FACETS

 		//DISPLAYING TRENDS FACETS
		$searchTrendsFilter.find("li.facetTrends").remove();
		if(json != null && json.facets != null && json.facets.hashtags != null && json.facets.hashtags.terms.length > 0){
			$searchTweetersFilter.find("li.facetTrends").remove();
			for(var i = 0; i <= json.facets.hashtags.terms.length -1; i++){
				var term = json.facets.hashtags.terms[i];
 				var liHtml = '<li class="facetTrends"> '+
					    	 '<a href="">' +term.term+'</a> ('+term.count+')'+
					     '</li>';
                                var li = $(liHtml);
				$searchTrendsFilter.append(li);
			}
		}
		$searchTrendsFilter.find("li.facetTrends").each(function(){
			$(this).find('a').click(function(ev){
				ev.preventDefault(); 
				addFilter("hashtag.text",$(this).text());
				launchESQuery();
			});
		});
		//END DISPLAYING TRENDS FACETS


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

	$( "a#removeTweetersFilter").click(function(event){
		event.preventDefault(); 
		removeFilter("user.screen_name");
		launchESQuery();
	});
	$( "a#removeTrendsFilter").click(function(event){
		event.preventDefault(); 
		removeFilter("hashtag.text");
		launchESQuery();
	});

	function addFilter(cle, valeur) {
		// On vérifie si and existe ou non.
		var obj = filters.match_all;
		if (obj != null) {
			filters = {	"and" : [ ] };
		}

		var i = 0;
		for ( ; i < filters.and.length ; i++ ) {
			for	(code in filters.and[i].term) {
				if (code == cle) {
					filters.and.splice(i, 1);
					break;
				}
			}
		}

		var chaine = '{ "term" : { "' + cle + '" : "' + valeur + '" } }';
		filters.and.push( JSON.parse(chaine) );
	}

	function removeFilter(cle) {
		// On vérifie si and existe ou non.
		if (filters.and != null) {
			for (var i = 0 ; i < filters.and.length ; i++ ) {
				for	(code in filters.and[i].term) {
					if (code == cle) {
						filters.and.splice(i, 1);
						break;
					}
				}
			}

			for (var i = 0 ; i < filters.and.length ; i++ ) {
				for	(code in filters.and[i].range) {
					if (code == cle) {
						filters.and.splice(i, 1);
						break;
					}
				}
			}

			if (filters.and.length == 0) {
				filters = { "match_all" : { } };
			}
		}
	}
		 

});
