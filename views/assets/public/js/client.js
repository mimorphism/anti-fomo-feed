$('.btn-save').click(function(){  
    var linkId = $('.btn-save').attr("data-linkid");
  $.ajax({  
      url:'http://localhost:3000/updateLink',  
      method:'post',  
      dataType:'json',  
      data:JSON.stringify({'linkId':linkId, 'opType': 'SAVE'}),  
      contentType: "application/json",
      success:function(response){  
          if(response.status==200){  
          alert('link updated successfully');  
          }else{  
              alert('some error occurred try again');  
          }  
      },  
      error:function(response){  
          alert('server error occured')  
      }  
  });  
});  
$('.btn-delete').click(function(){  
    var linkId = $('.btn-delete').attr("data-linkid"); 
    $.ajax({  
        url:'http://localhost:3000/updateLink',  
        method:'post',  
        dataType:'json', 
        contentType: "application/json", 
        data:JSON.stringify({'linkId':linkId, 'opType': 'DELETE'}),  
        success:function(response){  
            if(response.status==200){  
            alert('link updated successfully');  
            }else{  
                alert('some error occurred try again');  
            }  
        },  
        error:function(response){  
            alert('server error occured')  
        }  
    });  
});  