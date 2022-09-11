
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server, Socket } = require("socket.io");
const io = new Server(server);
var crypto = require('crypto');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chillchat.db');

var image_profile = "https://s6.uupload.ir/files/icon_defult_0rl5.jpg"

var image_save = "https://s6.uupload.ir/files/save_icon_alf9.png"

var image_group = "https://s6.uupload.ir/files/icon_group_j8p3.png"

var image_channel = "https://s6.uupload.ir/files/icon_q897.png"

var image_bot = "https://s6.uupload.ir/files/icon_bot_vi58.png"

db.serialize(function() {
 
  db.run("CREATE TABLE if not exists users (name TEXT, username TEXT PRIMARY KEY, password TEXT, chats TEXT, image TEXT DEFAULT  '"+image_profile+"'  , bio TEXT DEFAULT 'Keep your friends, loneliness is not good :)', tag TEXT) ");

  db.run("CREATE TABLE if not exists save_message (id INTEGER PRIMARY KEY, chat_name TEXT, id_user TEXT, image TEXT DEFAULT  '"+image_save+"' , last_message TEXT , date_last_message TEXT ) ");

  db.run("CREATE TABLE if not exists channel_news (id INTEGER PRIMARY KEY, chat_name TEXT, id_user TEXT, image TEXT DEFAULT  '"+image_channel+"' , last_message TEXT , date_last_message TEXT) ");

  db.run("CREATE TABLE if not exists bots (id INTEGER PRIMARY KEY, chat_name TEXT, id_user TEXT, image TEXT DEFAULT  '"+image_bot+"' , last_message TEXT , date_last_message TEXT) ");

  db.run("CREATE TABLE if not exists private_chats  (id INTEGER PRIMARY KEY, user_one TEXT, user_two TEXT) " );

  db.run("CREATE TABLE if not exists group_chats  (id INTEGER PRIMARY KEY, name_group TEXT, id_group TEXT , image TEXT DEFAULT '"+image_group+"' , user_create TEXT , time TEXT ) " );

  db.run("CREATE TABLE if not exists group_members  (id INTEGER PRIMARY KEY, id_group TEXT, id_user TEXT, status TEXT, status_admin TEXT DEFAULT 'is not' ) " );

  db.run("CREATE TABLE if not exists group_messages  (id INTEGER PRIMARY KEY, id_group TEXT , id_message TEXT , type_message TEXT , message TEXT, id_sender_message TEXT, name_sender TEXT, img_sender TEXT, time_sender TEXT ) " );

});

/*
db.run('INSERT INTO group_messages (id_group,id_message,type_message,message,id_sender_message,name_sender,img_sender,time_sender) VALUES (?,?,?,?,?,?,?,?) ' , ['chillchat~group?!://09ce640b670b5bb422f0a5e19a4d3e23dfdb0aad' , 'alfoahfoswdsww' , 'message' , 'it is good' , 'poyan015' , 'poyan' , 'https://s6.uupload.ir/files/icon_defult_0rl5.jpg' , '7:50' ]  ,  function(err) {

});
*/

var port = 8000

app.get('/', (req, res) => {

    res.send('server running on port ' + port);

});

io.on('connection', function(socket){

    console.log('a user is connected ' + socket.id);

    var message_connect = 'Chillchat'

    socket.emit('connect_name', {key_connect:message_connect} );
  

    socket.on('singup', function(name, username, password){

      var chats_list = "no"

      db.run('INSERT INTO users (name,username,password,chats) VALUES (?,?,?,?) ' , [name , username , password , chats_list ]  ,  function(err) {
        
        if (err) {

          var message_primary = 'Username already exists !'
          
          socket.emit('primary', {message_error:message_primary} );

        } else {

          var message_successful = 'Registration was successful ✅'
          
          socket.emit('successful', {message_ok: message_successful, message_chat: chats_list } );

          db.run('INSERT INTO save_message (chat_name,id_user) VALUES (?,?) ' , ['Saved Message' , username]  ,  function(err) {

          });

          db.run('INSERT INTO channel_news (chat_name,id_user) VALUES (?,?) ' , ['Chillchat News' , username]  ,  function(err) {

          });

          db.run('INSERT INTO bots (chat_name,id_user) VALUES (?,?) ' , ['Mr.Friend' , username]  ,  function(err) {
            
          });
        }
      });
  });

  socket.on('login', function(username, password) {

    db.each("SELECT name,chats FROM users WHERE username = '"+username+"' AND password = '"+password+"' " ,  function(err, row) {

      if (row.length > 0) {
        
        var message_ok = 'Login was successful ✅'
        
        socket.emit('ok_username', {ok_key:row.name} , {chats_key:row.chats} );

      } else {

        var message_error = 'The username or password is incorrect !'
        
        socket.emit('error_username', {error_key:message_error} );

      }

    });
  });

  socket.on('send_message_group' , function(id_messages, id_group ,type, message, user, name, img, time) {

    if (id_messages.length == 0) {

      var id_messages = id_group + type + message + time + user + crypto.randomBytes(25).toString('hex') ;

    } else {

    }

    db.all("INSERT INTO group_messages (id_group,id_message,type_message,message,id_sender_message,name_sender,img_sender,time_sender) VALUES ('"+id_group+"','"+id_messages+"','"+type+"','"+message+"','"+user+"','"+name+"','"+img+"','"+time+"') " , function(err, row) {

      io.emit('sended_message_group' ,  { send_id_messages: id_messages , send_id_group: id_group , send_type: type , send_message: message , send_user: user , send_name: name , send_img: img , send_time: time } );

    });
    
  });

  socket.on('select_details_user', function(username) {

    db.each("SELECT name,image,tag FROM users WHERE username = '"+username+"' " , function(err, row) {
      
      socket.emit('send_details_user', { name_user: row.name , image_user: row.image , tag_user: row.tag } );
    
    });

  });


  socket.on('set_status' , function(id,status) {

    db.run("UPDATE group_members SET status = '"+status+"' WHERE id_user = '"+id+"' " ,  function(err, row) {

    });    

  });

  socket.on("read_details_group" , function(id_group) {

    db.all("SELECT name_group,id_group,image,user_create,time FROM group_chats WHERE id_group = '"+id_group+"' " , function(err, row) {

      if (row.length == 0) {


      } else {
        
        var name = row[0].name_group;
        var username = row[0].id_group;
        var image = row[0].image;
        var user_create = row[0].user_create;
        var time = row[0].time;
        
        socket.emit("read_details_grouped", { message_name_group: name , message_username_group: username , message_image_group: image , message_user_create_group: user_create , message_time_group: time } );
      
      }
    
    });
    
  });

  socket.on("read_list_chats" , function(id_group) {

    db.each("SELECT * FROM group_messages WHERE id_group = '"+id_group+"' " , function(err, row) {

      if (row.length == 0) {


      } else {
        
        var group = row.id_group;
        var id_message = row.id_message;
        var type = row.type_message;
        var message = row.message;
        var id_sender_message = row.id_sender_message;
        var name_sender = row.name_sender;
        var img_sender = row.img_sender;
        var time_sender = row.time_sender;
        
        socket.emit("read_list_chated", { id_group_list: group , id_message_list: id_message , type_list: type , message_list: message , id_sender_message_list: id_sender_message , name_sender_list: name_sender , img_sender_list: img_sender , time_sender_list: time_sender } );

      }
    
    });
    
  });

  socket.on('check_id_private_group', function(data) {

    var id = "chillchat~group?!://" + crypto.randomBytes(20).toString('hex') ;

    db.all("SELECT id_group FROM group_chats WHERE id_group = '"+id+"' " , function(err, row) {

      if (row.length == 0) {

        socket.emit("checked_id_private_group", {message_id: id} );

      } else {

        var id2 = "chillchat~group?!://" + crypto.randomBytes(21).toString('hex') ;

        socket.emit("checked_id_private_group", {message_id: id2} );

      }
    
    });
  
  });

  socket.on('check_id_group_public', function(id) {

    db.all("SELECT id_group FROM group_chats WHERE id_group = '"+id+"' " , function(err, row) {

      if (row.length == 0) {

        socket.emit("checked_id_public_group", {result_id: id} );

      } else {

        socket.emit("checked_id_public_group", {result_id: 'id already exists'} );

      }
    
    });
    
  });


  socket.on('show_save_message', function(username, time) {

    db.each("SELECT id,chat_name,id_user,image FROM save_message WHERE id_user = '"+username+"' " , function(err, row) {
      
      var message = 'Saved Message'
      
      socket.emit('show_saved_message', { message_id: row.id , message_text: message , message_time: time , profile_img: row.image } );
    
    });
});

  socket.on('check_select_username', function(username_one,username_two) {

    db.all("SELECT user_one,user_two FROM private_chats WHERE user_one = '"+username_one+"' AND user_two = '"+username_two+"' " , function(err, row) {
      
      if (row.length == 0) {

        db.all("SELECT name,username,image,bio,tag FROM users WHERE username = '"+username_two+"' " , function(err, row) {
          
          if (row.length == 0) {
            
            socket.emit("null_select_user", {message_null:"no user found"} );
        
        } else {
          
          var name = row[0].name;
          var username = row[0].username;
          var image = row[0].image;
          var bio = row[0].bio;
          var tag = row[0].tag;
          
          socket.emit("ok_select_user", {message_user_name:name , message_username:username  , message_user_image:image , message_user_bio:bio , message_user_tag:tag  } );
        
        }
      });
      
      } else {
        
        socket.emit("null_select_user", {message_null:"have a chat"} );
      
      }
    });
  });

  socket.on('create_private_message', function(username_one,username_two) {

    db.all("INSERT INTO private_chats (user_one,user_two) VALUES ('"+username_one+"','"+username_two+"') " , function(err, row) {

      socket.emit('created_private_message', { message_create: username_two } );

    });
  });

  socket.on('create_group_public', function(name_group,id_group,user_create,time) {

    db.all("INSERT INTO group_chats (name_group,id_group,user_create,time) VALUES ('"+name_group+"','"+id_group+"','"+user_create+"','"+time+"') " , function(err, row) {

      socket.emit('created_group_public', { name_created_group_public: name_group , id_created_group_public: id_group , img_created_group_public: image_group , user_created_group_public: user_create , time_group_public: time  } );

    });
  });

  socket.on('create_group_private', function(name_group,id_group,user_create,time) {

    db.all("INSERT INTO group_chats (name_group,id_group,user_create,time) VALUES ('"+name_group+"','"+id_group+"','"+user_create+"','"+time+"') " , function(err, row) {

      socket.emit('created_group_private', { name_created_group_private: name_group , id_created_group_private: id_group , img_created_group_private: image_group , user_created_group_private: user_create , time_group_private: time  } );

    });

  });

  socket.on('add_user_member' , function(id,username) {

    db.all("INSERT INTO group_members (id_group,id_user) VALUES ('"+id+"','"+username+"') " , function(err, row) {

      socket.emit('added_user_member', {message_add : 'added'} );

    });
    
  });

  socket.on('add_member_group' , function(id,username) {

    db.all("INSERT INTO group_members (id_group,id_user) VALUES ('"+id+"','"+username+"') " , function(err, row) {

      socket.emit('added_member_group', {message_adds : username} );

    });
    
  });

  socket.on("send_details_user2", function(username) {

    db.all("SELECT name,image FROM users WHERE username = '"+username+"' " , function(err , row) {

      
      socket.emit('sended_details_user2', { message_user_two:username , message_name_usertwo:row[0].name , message_img_usertwo:row[0].image } );
    
    });

  });

  socket.on('show_channel_news', function(username, time) {

    db.each("SELECT id,chat_name,id_user,image FROM channel_news WHERE id_user= '"+username+"' " , function(err, row) {
      
      var message = 'Chillchat News'
      
      socket.emit('show_channeled_news', { message_id: row.id , message_text: message , message_time: time , profile_img: row.image } );

    });
  });

  socket.on('show_bots', function(username, time) {

    db.each("SELECT id,chat_name,id_user,image FROM bots WHERE id_user= '"+username+"' " , function(err, row) {
      
      var message = 'Mr.Friend'
      
      socket.emit('showed_bots', { message_id: row.id , message_text: message , message_time: time , profile_img: row.image } );

    });
  });
  
  socket.on('connect_name_group' , function(id) {

    db.each("select count(id_group) from group_members where id_group = '"+id+"' ", function(err, row) {

      var resultArray = Object.values(JSON.parse(JSON.stringify(row)))

      socket.emit('connected_name_group', {message_member: resultArray[0]} ) ;
    
    });
    
  });

  socket.on("read_list_groups" , function(username) {

    db.each("select id_group from group_members where id_user = '"+username+"' ", function(err, row) {

      var resultArray = Object.values(JSON.parse(JSON.stringify(row)))
    
      socket.emit('readied_list_groups', {message_read: resultArray[0] } ) ;
    
    });

  });

  socket.on('check_admin_group', function(id,username,type) {

    db.all("SELECT id_group,id_user,status_admin FROM group_members WHERE id_group = '"+id+"' AND id_user = '"+username+"'  " , function(err, row) {

      if (row[0].status_admin == 'is') {

        socket.emit('checked_admin_group', { message_admin: 'is admin' , message_type: type } );

      } else {

        socket.emit('checked_admin_group', { message_admin: 'is not admin' , message_type: type } );

      }

    });
  
  });

  socket.on('status_group' , function(id) {

    db.each("select count(id_group) from group_members where id_group = '"+id+"' and status = '"+'online'+"' ", function(err, row) {

      var resultArray = Object.values(JSON.parse(JSON.stringify(row)))

      socket.emit('stated_group', {message_online: resultArray[0]} ) ;
    
    });
    
  });

  socket.on('check_username_add_member' , function (username , id_group) {

    db.all("SELECT id_group,id_user FROM group_members WHERE id_group= '"+id_group+"' AND id_user = '"+username+"' " , function(err, row) {
      
      if (row.length == 0) {

        db.all("SELECT name,username,image,bio,tag FROM users WHERE username = '"+username+"' " , function(err, row) {
          
          if (row.length == 0) {
            
            socket.emit("null_selected_user", {message_null:"no user found"} );
        
        } else {
          
          var name = row[0].name;
          var username = row[0].username;
          var image = row[0].image;
          var bio = row[0].bio;
          var tag = row[0].tag;
          
          socket.emit("checked_username_add_member", {message_user_name:name , message_username:username  , message_user_image:image , message_user_bio:bio , message_user_tag:tag  } );
        
        }
        
      });
      
      } else {
        
        socket.emit("null_selected_user", {message_null:"have added"} );
      
      }
    });

  });

  socket.on('show_typing', function(username, name, status) {
    
    io.emit('showed_typing', {message_username: username , message_name: name , message_status: status } );

  });

  socket.on('change_message_group', function(id_group, id_message, new_message, username) {
    
    db.run("UPDATE group_messages SET message = '"+new_message+"' WHERE id_group = '"+id_group+"' AND id_message = '"+id_message+"'   " ,  function(err, row) {

      io.emit('changed_message_group', { message_username: username  } );

    });
    
  });

  socket.on('delete_message_group', function(id_group, id_message, username) {

    db.run("DELETE FROM group_messages WHERE id_group = '"+id_group+"' AND id_message = '"+id_message+"' " , function(err, row) {

      io.emit('deleted_message_group', { message_username: username  } );
      
    });
    
  });
  
  socket.on('disconnect', function(id,status) {
      
    console.log('a user is disconnected !');

    var message_disconnect = 'Connecting to server'

    socket.emit('disconnect_name', {key_disconnect:message_disconnect} );
      
  });
});
  
server.listen(port, () => {

    console.log('server running on port ' + port);

});

