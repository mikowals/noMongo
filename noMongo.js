var linkedCollection = new Meteor.Collection( null ); // communicates but can not write to database.  See allow deny rules

if (Meteor.isClient) {
//  Meteor.subscribe( null );
  Template.hello.greeting = function () {
    return linkedCollection.find({});
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
        var doc = linkedCollection.findOne({});
	if( doc ) {
	  Meteor.call( 'fakeUpdate', doc._id , {$inc: {clickCount: 1} }, function( error ){
	    if( error ){
	      console.log ( "error from update: " + error);
	    }
	  });
	} else{
	  linkedCollection.insert( {clickCount: 1} );
	}
    }
  });
};

Meteor.methods({
  fakeUpdate: function( id, modifier, cb ){
    var self = this;
    if ( self.isSimulation ){
      linkedCollection.update( id, modifier );
    } else{
      linkedCollection.update( id, modifier, cb );
    }
  }
});

if (Meteor.isServer) {
  var noMongo = new Meteor.Collection( null ); 
  
  linkedCollection.allow({
    insert: function( userId, doc )  { 
      noMongo.insert( doc ); // can be done here but might be cleaner to make a fakeInsert method;
      return true;
    },
    
    update: function(userId, doc, fields, modifier) {
      return true;
    },
    
    remove: function(userId, doc) {
      return true;
    }
  });

  Meteor.publish( null , function() {
    var self = this;
    var handle = linkedCollection.find({}).observe({

      added: function (doc){
	self.added( null , doc._id, doc );
      },
      removed: function ( doc ){
	self.removed( null , doc._id );
      },
    
      changed: function ( doc ){
	self.changed( null , doc._id, doc );
      }
    });
    
    self.onStop( function (){
      handle.stop();
    });
    
    self.ready();
/**
    var published = linkedCollection.find({});
    console.log( published );
    return published;
    **/
  });
  
  Meteor.startup(function () {
    linkedCollection.insert( {_id: "007", clickCount: 10});
    // code to run on server at startup
  });
}
