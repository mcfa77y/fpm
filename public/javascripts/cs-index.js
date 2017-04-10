$(function() {
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
                    if (!(win.location.href.indexOf("http://localhost:3000/oauth2callback") < 0)) {
                        clearInterval(checkConnect);
                        window.location.reload();
                    }
                }, 100);
            });
        });



});
