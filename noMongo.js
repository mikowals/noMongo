
if (Meteor.isClient) {
  var linkedCollection = new Meteor.Collection( 'publishedCollection' ); 
  Template.hello.greeting = function () {
    return linkedCollection.find({});
  };

 Meteor.subscribe( 'publishedCollection' );   
  Template.hello.events({
    'click input' : function () {
        var doc = linkedCollection.findOne({});
	if( doc ) {
	  Meteor.call( 'fakeUpdate', doc._id , {$inc: {clickCount: 1} }, function( error ){
	    if( error ){
	      console.log ( "error from update: " + error);
	    }
	  });
	} else{
	  Meteor.call( 'fakeInsert', {clickCount: 1} );
	  linkedCollection.insert( {clickCount: 1});  // This will fail because linkedCollection on client does not have insert method.
	}

    }
  });
};



Meteor.methods({

//shared code so method runs on client as stub and on server
////linkedCollection is a trick because both client and server each have a local collection with that name

  fakeUpdate: function( id, modifier, cb ){
  /*  var self = this;
    if ( self.isSimulation ){
      clientCollection.update( id, modifier );
    } else{
      serverCollection.update( id, modifier, cb );
    }*/
    linkedCollection.update( id, modifier, cb);
  },


  fakeInsert: function( doc ){
    linkedCollection.insert( doc );
    },

  fakeRemove: function ( id ){
    if (check( id, String )){
      linkedCollection.remove( doc._id );
    }
  }
});

if (Meteor.isServer) {
  var linkedCollection = new Meteor.Collection( null ); // communicates but can not write to database.  See allow deny rules
  
  Meteor.publish( 'publishedCollection' , function() {
    var self = this;
    var handle = linkedCollection.find({}).observe({

      added: function (doc){
	self.added( 'publishedCollection' , doc._id, doc );
      },
      removed: function ( doc ){
	self.removed( 'publishedCollection' , doc._id );
      },
    
      changed: function ( doc ){
	self.changed( 'publishedCollection' , doc._id, doc );
      }
    });
    
    self.onStop( function (){
      handle.stop();
    });
    
    self.ready();
    
  });
  
};
