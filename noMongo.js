
if (Meteor.isClient) {
  var linkedCollection = new Meteor.Collection( 'publishedCollection' ); 

  Template.hello.greeting = function () {
    return linkedCollection.find({});
  };

 // Meteor.subscribe( 'publisher' );   
  
  Template.hello.events({
    'click input' : function () {
        var doc = linkedCollection.findOne({});
	if( doc ) {
	  Meteor.call( 'fakeUpdate', doc._id , {$inc: {clickCount: 1} }, function( error ){
	    if( error ){
	      console.log ( "error from update: " + error);
	    
	    }
	  });
	  // linkedCollection.update( doc._id, {$inc: {clickCount: 1} } ); // This will fail because linkedCollection does not have update Metoer method.
	} else{
	  Meteor.call( 'fakeInsert', {clickCount: 1} );
	  //linkedCollection.insert( {clickCount: 1});  // This will fail because linkedCollection does not have insert Meteor method.
	}
    }
  });
};

Meteor.methods({

//shared code so method runs on client as stub and on server with access to server local collection.
////linkedCollection is a trick because the  client and server each have their own collection with that name

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
    var self = this;
    if (self.isSimulation){
      doc._id = linkedCollection.insert( doc ); // without this ids can get out of sync.  With it server may receive duplicate id.
    } else{
      linkedCollection.insert( doc );
    }
  },

  fakeRemove: function ( id ){
    if (check( id, String )){ // this check prevents client from breaking 1 document at a time rule
      linkedCollection.remove( doc._id );
    }
  }
});

if (Meteor.isServer) {
  var linkedCollection = new Meteor.Collection( null ); //local collection because of null name
  
  Meteor.publish( null , function() {
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
     
    var newId = linkedCollection.insert(  { guestId: linkedCollection.find({}).count() + 1, clickCount: 0}  );    
    var newDoc = linkedCollection.findOne(newId );
    self.changed( 'publishedCollection' , newDoc._id, {guestId: newDoc.guestId, clickCount: newDoc.clickCount, privateMessage:"a secret message to " +  newDoc.guestId} );
    self.ready();
  });
  
};
