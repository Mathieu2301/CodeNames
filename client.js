$(function () {

    // Initialize variables

    var colorRouge = '#900000';
    var colorBleu =  '#0035a8';
    var colorGris =  '#e4d298';
    var colorNoir =  '#000000';
    
    var $window = $(window);

    var $MainPage =             $('.main');             // The main page
    var $DevinPage =            $('.devin');            // The devin game page
    var $DonneurIndicesPage =   $('.donneurindices');   // The donneurindices game page


    var main$devinBtn =            $('.devinBtn');            //The devin button
    var main$donneurindicesBtn =   $('.donneurindicesBtn');   //The donneurindices button

    var socket = io();
    var highest_ping = 0;
    var lowest_ping = 9999;

    var delay = 100;
    var showInfos = false;

    var scorebleu = 0;
    var scorerouge = 0;
    var tour;

    var status = "main";

    $DevinPage.hide();
    $DonneurIndicesPage.hide();

    main$devinBtn.on('click', function(){ gotoDevin(); fullscreen(); });
    main$donneurindicesBtn.on('click', function(){ gotoEspion(); fullscreen(); });

    $('.next_btn').on('click', function(){ socket.emit('next-tour'); });

    getinfos();
    function getinfos(){
        var start = Date.now();
        socket.emit('paing', function clientCallback(infos) {
            var ping = (Date.now() - start);
            if (lowest_ping > ping){ lowest_ping = ping; }
            if (highest_ping < ping){ highest_ping = ping; }

            $('title').text("CodeNames - " + ping + 'ms');

            if (showInfos){
                var sdate = new Date(infos.startDate);
                var demarrage_serveur_date = (sdate.getDate()) + "/";
                demarrage_serveur_date += sdate.getMonth() + 1 + " à ";
                demarrage_serveur_date += sdate.getHours() + ":"; 
                demarrage_serveur_date += sdate.getMinutes();
                
                var wdate_txt;
                if ((infos.workingTime / 1000) < 60){ // infos.workingTime en dessous de 1 minute
                    wdate_txt = infos.workingTime / 1000 + " sec";
                }else if (((infos.workingTime / 1000) / 60) < 60){ // infos.workingTime en dessous de 1 heure
                    wdate_txt = Math.round((infos.workingTime / 1000) / 60) + " min"
                }else{
                    wdate_txt = Math.round(((infos.workingTime / 1000) / 60) / 60) + " heure(s)";
                }
                
                scorebleu = Math.round((infos.turned_cards_bleu  / 9) * 10000) / 100;
                scorerouge = Math.round((infos.turned_cards_rouge / 8) * 10000) / 100;

                tour = infos.tour;

                var msg  = "Ping = " + ping + "ms (" + lowest_ping + "ms ; " + highest_ping + "ms) | Srv_start_date = " + demarrage_serveur_date + " | Srv_runtime = " + wdate_txt + " | Requests = " + infos.requests_nbr + " | Total requests = " + infos.total_requests_nbr + " | Delay = " + delay;
                var party_msg = "Players = " + infos.player_nbr + " | Tour actuel = " + tour + " | Score bleu = " + scorebleu + "%" + " | Score rouge = " + scorerouge + "%";

                $('#infos_txt').text(msg);
                $('#party_infos_txt').text(party_msg);
            }else{
                $('#infos_txt').text("");
                $('#party_infos_txt').text("");
            }

            setTimeout(function() {
                getinfos();
            }, delay);
        });
    }

    function gotoDevin(){
        if (scorebleu == 0 && scorerouge == 0){
            status = "devin";
            $DevinPage.fadeIn();
            $MainPage.hide();
            socket.emit('getcards');
        }else{
            alertify.warning("Impossible de rejoindre : une partie est déjà en cours.")
        }
    }

    function gotoEspion(){
        status = "espion";
        $DonneurIndicesPage.fadeIn();
        $MainPage.hide();
        socket.emit('getcards+colors');
    }

    function gotoMain(){
        $('.htmlbgcolor').css('background-color', "#c8c8c8");
        $DevinPage.fadeOut();
        $DonneurIndicesPage.fadeOut();
        status = "main";
        $MainPage.fadeIn();
    }
    
    document.onkeypress=function(e){
        e=e||window.event;
        var key=e.which?e.which:event.keyCode;
        if (key== 109){ // M
            alertify.message("P : Retour au menu \n A : Assign user \n R : Reload client \n D : Modifier le delay \n I : Afficher/Masquer les infos \n Shift + R : Reload serveur \n Shift + S : Eteindre le serveur");
        }else if (key == 114){ // R
            reloadclient();
        }else if (key == 100){ // D
            var p = prompt("Nouveau delay :", delay)
            if (p != ""){
                delay = Math.round(p);
            }
        }else if (key == 112){ // P
            gotoMain();
        }else if (key == 97){ // A
            var uid = prompt("User :")
            if (uid != ""){
                var p = prompt("Page [main, espion, devin] :")
                if (p != ""){
                    socket.emit('admin-assignuser', {
                        userid: uid,
                        page: p
                    });
                }
            }
        }else if (key == 82){ // Shift + R
            if (confirm("Voulez-vous vraiment reload le serveur ?") == true) {
                socket.emit("reload-serveur");
            }
        }else if (key == 83){ // Shift + S
            if (confirm("Voulez-vous vraiment éteindre le serveur ?") == true) {
                socket.emit("stop");
            }
        }else if (key == 105){ // I
            if (showInfos){
                $('#infos_txt').text("");
                $('#party_infos_txt').text("");
                showInfos = false;
            }else{
                $('#infos_txt').text("9999 ms");
                $('#party_infos_txt').text("");
                showInfos = true;
            }
            alertify.warning('showInfos = ' + showInfos);
        }
        
        console.log("K = " + key)
    }

    socket.on('goto', function(page){
        if (page == "espion"){
            gotoEspion();
        }else if (page == "devin"){
            gotoDevin();
        }else{
            gotoMain();
        }
    });

    socket.on('connect', function () {
        if (status == "devin"){
            socket.emit('getcards');
            alertify.success("Connexion rétablie !");
            $('#welcomeMessage').text("Connexion rétablie ! Sélectionnez votre rôle :");
        }else if (status == "espion"){
            socket.emit('getcards+colors');
            alertify.success("Connexion rétablie !");
            $('#welcomeMessage').text("Connexion rétablie ! Sélectionnez votre rôle :");
        }else{
            $('#welcomeMessage').text("Sélectionnez votre rôle :");
        }
    });

    socket.on("disconnect", function(){
        $('title').text("CodeNames - Déconnecté");
        $('#welcomeMessage').text("Connexion perdue...");
        alertify.error("Connexion perdue...");
    });

    socket.on('setbackcolor', function (color) {
        if (status != "main"){
            $('.htmlbgcolor').css('background-color', color);
            new Audio("https://www.memoclic.com/medias/sons-wav/1/336.wav").play();
        }
    });

    socket.on('cartes+colors', function (data) {
        console.log(data);
        var nbr = 1;
        while (true){
            if (nbr != 26){
                $('.carte_' + nbr).text(data.mots[nbr]);
                $('.carte_' + nbr).css('background-color',data.couleurs[nbr]);
                if (data.couleurs[nbr] == colorGris){
                    $('.carte_' + nbr).css('color',colorNoir);
                }else{
                    $('.carte_' + nbr).css('color','#FAFAFA');
                }
                nbr = nbr + 1;
            }else{
                break;
            }
        }
    });

    socket.on('cartes', function (data) {
        console.log(data);
        var nbr = 1;
        while (true){
            if (nbr != 26){
                $('.carte_' + nbr).text(data.mots[nbr]);
                $('.carte_' + nbr).css('color',colorNoir);
                $('.carte_' + nbr).css('background-color','#E6E6E6');
                nbr = nbr + 1;
            }else{
                break;
            }
        }
        $('.carte_1').on('click', function(){ turncard(1) });
        $('.carte_2').on('click', function(){ turncard(2) });
        $('.carte_3').on('click', function(){ turncard(3) });
        $('.carte_4').on('click', function(){ turncard(4) });
        $('.carte_5').on('click', function(){ turncard(5) });
        $('.carte_6').on('click', function(){ turncard(6) });
        $('.carte_7').on('click', function(){ turncard(7) });
        $('.carte_8').on('click', function(){ turncard(8) });
        $('.carte_9').on('click', function(){ turncard(9) });
        $('.carte_10').on('click', function(){ turncard(10) });
        $('.carte_11').on('click', function(){ turncard(11) });
        $('.carte_12').on('click', function(){ turncard(12) });
        $('.carte_13').on('click', function(){ turncard(13) });
        $('.carte_14').on('click', function(){ turncard(14) });
        $('.carte_15').on('click', function(){ turncard(15) });
        $('.carte_16').on('click', function(){ turncard(16) });
        $('.carte_17').on('click', function(){ turncard(17) });
        $('.carte_18').on('click', function(){ turncard(18) });
        $('.carte_19').on('click', function(){ turncard(19) });
        $('.carte_20').on('click', function(){ turncard(20) });
        $('.carte_21').on('click', function(){ turncard(21) });
        $('.carte_22').on('click', function(){ turncard(22) });
        $('.carte_23').on('click', function(){ turncard(23) });
        $('.carte_24').on('click', function(){ turncard(24) });
        $('.carte_25').on('click', function(){ turncard(25) });
    });

    socket.on('carteturned', function (data) {
        var carte_txt = $('.carte_' + data.nbr).html();
        $('.carte_' + data.nbr).notify("Mot : " + carte_txt, "info");
        $('.carte_' + data.nbr).css('background-color',data.color);
        $('.carte_' + data.nbr).text("");
    });

    socket.on('end', function (data) {
        $('.carte_' + data.nbr).css('background-color', data.color);
        $('.carte_' + data.nbr).text("");
        setTimeout(function() {
            alertify.message(data.msg);
            $('#welcomeMessage').text(data.msg);
            gotoMain();
        }, 1500);
    });

    socket.on('reload-serveur', function () {
        alertify.message("Reload serveur...");
        $('#welcomeMessage').text("Reload serveur...");
        $('title').text("Reload serveur...");
        setTimeout(function() {
            reloadclient();
        }, 10);
    });

    socket.on('stop', function () {
        $('#welcomeMessage').text("Le serveur s'est arreté");
        $('title').text("CodeNames - Déconnecté");
        alertify.error("Connexion perdue");
        gotoMain();
        socket.on('connect', function () {
            $('#welcomeMessage').text("Reconnexion réussie - Sélectionnez votre rôle :");
            alertify.success("Reconnexion réussie !");
        });
    });

    socket.on('user-connected', function(id){
        alertify.message("Un utilisateur s'est connecté");
    });

    socket.on('user-disconnected', function(id){
        alertify.message("Un utilisateur s'est déconnecté");
    });

    socket.on('user-goto', function(data){
        var status = data.status;
        var id = data.userid;

        var msg = "Un utilisateur a rejoint un role";

        if (status == "devin"){
            msg = 'Un utilisateur a rejoint les devins';
        }else if (status == "espion"){
            msg = 'Un utilisateur a rejoint les espions';
        }
        alertify.message(msg);
    });

    function reloadclient(){
        if (status == "devin"){
            socket.emit('getcards');
            alertify.success("Reload client terminé !");
            $('#welcomeMessage').text("Connexion rétablie ! Sélectionnez votre rôle :");
        }else if (status == "espion"){
            socket.emit('getcards+colors');
            alertify.success("Reload client terminé !");
            $('#welcomeMessage').text("Connexion rétablie ! Sélectionnez votre rôle :");
        }else{
            $('#welcomeMessage').text("Sélectionnez votre rôle :");
        }
    }

    function turncard(nbra){

        if (status == "devin"){
            if ($('.carte_' + nbra).css('background-color') == "rgb(230, 230, 230)"){
                socket.emit('turn-card', {
                    nbr: nbra
                });
            }else{
                $('.carte_' + nbra).notify("Cette carte a déja été retournée", "info");
            }
        }        
    }

    function fullscreen(){
        var docElm = document.documentElement;
        if (docElm.requestFullscreen) {
            docElm.requestFullscreen();
        }
        else if (docElm.mozRequestFullScreen) {
            docElm.mozRequestFullScreen();
        }
        else if (docElm.webkitRequestFullScreen) {
            docElm.webkitRequestFullScreen();
        }
    }

});