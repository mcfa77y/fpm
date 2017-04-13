$(function() {
    setupToastr();
    var win;
    var checkConnect;
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
