$(function() {
    setupToastr();
    var win;
    var checkConnect;
    let counter = 0;
    var $connect = $("#linkAccount");
    //var oAuthURL = "http://example.com/account/_oauth?redirect_url=" + redirect_url;
    $.ajax({
            method: "GET",
            url: "oAuthUrl",

        })
        .done(function(url) {
            $connect.click(function() {
                win = window.open(url, 'SomeAuthentication', 'width=972,height=660,modal=yes,alwaysRaised=yes');
                checkConnect = setInterval(function() {
                    console.log('checking' + counter)
                    counter++
                    if (!win || !win.closed) return;
                    clearInterval(checkConnect);
                    // window.location.reload();
                    window.location.replace("/do_things");
                }, 100);

            });
        });

    $('#removeDups').click(() => {
        $.ajax({
                method: "GET",
                url: "remove_dups",

            })
            .done(function(url) {
                toastr["success"]("Doops removed")
            })
            .catch((err) =>{
                toastr['error']('something happened' + JSON.stringify(err,null,4))
            });
    })
    $('#a0').click(() => {
        $.ajax({
                method: "GET",
                url: "get_all_video_ids",

            })
            .done(function(data) {
                toastr["success"]("Data: "+ JSON.stringify(data,null,4))
            })
            .catch((err) =>{
                console.log(JSON.stringify(err,null,4))
                // toastr['error']('something happened' + JSON.stringify(err,null,4))
                $('#myModal').modal('toggle')
                $('#myModal').find('.modal-body').html(JSON.stringify(err,null,4))
            });
    })

    $('#a1').click(() => {
        $.ajax({
                method: "POST",
                url: "search_playlist",
                data:{ 
                    bands: $('#band_names').val(),
                    delimiter: $('#delimiter').val()}
            })
            .done(function(data) {
                $('#video_list').html(data)
            })
            .catch((err) =>{
                console.log(JSON.stringify(err,null,4))
                // toastr['error']('something happened' + JSON.stringify(err,null,4))
                $('#myModal').modal('toggle')
                $('#myModal').find('.modal-body').html(err.responseText)
            });
    })

    $('#listFromFile').click(() => {
        $.ajax({
                method: "GET",
                url: "search_playlist",

            })
            .done(function(data) {
                toastr["success"]("got pl")

            })
            .catch((err) =>{
                toastr['error']('something happened' + err)
            });
    })

});

function setupToastr() {
    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

}
