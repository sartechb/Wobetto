//Set Basic Info from User object
$("#user-name h1").html(app.user.get("name"));
$("#user-school h3").html(app.user.get("school"));
$("img#user-photo").attr("src", "assets/"+app.user.get("pic"));

//Get the activePosts, and locations/classes for post create autocomplete 
Parse.Cloud.run("getInitialData", {}, {
  success: function (response) {
   // console.log(response);
    app.activePosts = response.activePosts;
    app.locations = response.locations;
    app.classes = response.classes;
    for(var i = 0; i < app.activePosts.length; ++i)
      createActiveLink(app.activePosts[i].title, app.activePosts[i].postId);
  }, error: function(error){console.log(error);}
});

//If there are filters, we pull filtered posts and shut
//off filtering while the request completes.
app.filteringEnabled = false;
app.refreshTime = new Date();
Parse.Cloud.run("getPosts", {nextTen:true,areFilters:false,timeCutOff:app.refreshTime}, {
  success: function(response) {
   app.postOrder = [];
   app.posts = {};
   for(var x = 0; x < response.posts.length; ++x) {
    app.postOrder.push(response.posts[x].postId);
    app.posts[response.posts[x].postId] = response.posts[x];
    app.posts[response.posts[x].postId].filters = [];
  }
    //app.posts = response.posts;
    app.timeCutOff = response.timeCutOff;
    app.areMorePosts = response.areMorePosts;
   //if(app.user.get("filters").length == 0)
    for(var i = 0; i < app.postOrder.length; ++i) {
      createPost(app.posts[app.postOrder[i]], "recent", true);
    }
    //console.log(app.user.get("filters"));
    if(app.user.get("filters").length > 0)
      getFilterPosts(); 
  }, error: function(error) {console.log(error);}
});

function getFilterPosts() {
  var filters = app.user.get("filters");
  app.filters = [];
  app.t = 0;
  app.t1 = app.postOrder.length;
  //app.filters = app.user.get("filters");
  for(var x = 0; x < filters.length; ++x) {
    app.filters.push(JSON.parse(filters[x]));
    Parse.Cloud.run("getPosts", {
      nextTen:false,
      areFilters:true,
      filterString:app.filters[x].s,
      filterType:app.filters[x].t
    }, {
      success: function(response) {
        for(var i = 0; i < response.posts.length; ++i) {
          if(!(response.posts[i].postId in app.posts)) {
            app.postOrder.push(response.posts[i].postId);
            app.posts[response.posts[i].postId] = response.posts[i];
            app.posts[response.posts[i].postId].filters = [];
          }
          console.log(response.filterString, response.posts[i].postId);
          app.posts[response.posts[i].postId].filters.push(response.filterString.replace(" ", "_"));
        }
        ++app.t;
        if(app.t == app.user.get("filters").length) {
          fixPosts();
          refreshPostFeed();
          for(var n = 0; n < app.filters.length; ++n) {
            createFilter(app.filters[n].s);
          }
        }
      }, error: function(error) {console.log(error);}
    });
  }
}

function fixPosts() {
  //order in terms of time
  if(app.t1 < app.postOrder.length)
    for(var i = app.t1; i < app.postOrder.length; ++i) {
      var postTime = app.posts[app.postOrder[i]].time;
      for(var j = i-1; j >= 0; --j) {
        if(app.posts[app.postOrder[j]].time < postTime) {
          temp = app.postOrder[i];
          app.postOrder[i] = app.postOrder[j];
          app.postOrder[j] = temp;
        }
      }
    }
}

function refreshPostFeed() {
  for(var i = 0; i < app.postOrder.length; ++i) {
    if($("#postholder #"+app.postOrder[i]).length == 0) {
      if(i != 0) {
        createPost(app.posts[app.postOrder[i]], app.posts[app.postOrder[i]].filters.join(" "),false,app.postOrder[i-1]);
      } else {
        createPost(app.posts[app.postOrder[i]], app.posts[app.postOrder[i]].filters.join(" "),false,"top");
      }
    } else {
      for(var j = 0; j < app.posts[app.postOrder[i]].filters.length; ++j) {
        if(!($("#"+app.postOrder[i]).hasClass(app.posts[app.postOrder[i]].filters[j])))
          $("#"+app.postOrder[i]).addClass(app.posts[app.postOrder[i]].filters[j]);
      }
    }
  }
}

$("a#logout").click(function (e) {
    e.preventDefault();
    //alert("ehh");
    Parse.User.logOut();
    console.log("logging out");
    window.location.href = "http://sartechb.github.io/WebsiteTest/login.html";
});