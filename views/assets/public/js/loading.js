$('document').ready(function(){
    $.ajax({  
        url:'http://localhost:3000/generateFeed',  
        method:'get',  
        dataType:'html',  
        success:function(response){  
            console.log(response);
            $('.feed').html(response); 
            $('.loader').hide();
              },  
        error:function(response){  
            alert('server error occured')  
        }  
    });  
    
    });
