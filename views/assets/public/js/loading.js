var socket = io.connect();

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });

  socket.on("loading", (percentage) => {
    console.log(percentage);
    $('.loading-text').text("GENERATING FEED " + percentage + "%");
  });

$('document').ready(function(){
    $.ajax({  
        url:'http://localhost:3000/generateFeed',  
        method:'get',  
        dataType:'html',  
        success:function(response){  
            $('.feed').html(response); 
            $('.loader').hide();
              },  
        error:function(response){  
            alert('server error occured')  
        }  
    });  
    
    });

   

