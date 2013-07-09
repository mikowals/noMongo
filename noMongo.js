var linkedCollection = new Meteor.Collection( "linkedCollection" ); // communicates but can not write to database.  See allow deny rules

if (Meteor.isClient) {

  Meteor.subscribe ( 'linkedCollection' );

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
      noMongo.update( id, modifier, cb );
    }
  }
});

if (Meteor.isServer) {
  var noMongo = new Meteor.Collection( null ); 
  
  linkedCollection.allow({
    insert: function( userId, doc )  { 
      noMongo.insert( doc ); // can be done here but might be cleaner to make a fakeInsert method;
      return false;
    },
    
    update: function(userId, doc, fields, modifier) {
      return false;
    },
    
    remove: function(userId, doc) {
      return false;
    }
  });

  Meteor.publish( 'linkedCollection', function() {
    var self = this;
    var handle = noMongo.find({}).observe({

      added: function (doc){
	self.added( 'linkedCollection' , doc._id, doc );
      },
      removed: function ( doc ){
	self.removed( 'linkedCollection', doc._id );
      },
    
      changed: function ( doc ){
	self.changed( 'linkedCollection', doc._id, doc );
      }
    });
    
    self.onStop( function (){
      handle.stop();
    });
    
    self.ready(); 
  });
  
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
