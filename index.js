var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 80;

app.use(require('express').static(__dirname + "/"));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/client.js', function(req, res){
  res.sendFile(__dirname + '/client.js');
});
app.get('/favicon.ico', function(req, res){
  res.sendFile(__dirname + '/favicon.ico');
});
app.get('/devin.png', function(req, res){
  res.sendFile(__dirname + '/devin.png');
});
app.get('/espion.png', function(req, res){
  res.sendFile(__dirname + '/espion.png');
});

var colorRouge = '#900000';
var colorBleu =  '#0035a8';
var colorGris =  '#e4d298';
var colorNoir =  '#000000';

var infos = {
  startDate: Date.now(),
  workingTime: 0,
  player_nbr: 0,
  requests_nbr: 0,
  total_requests_nbr: 0,

  tour: "bleu",
  turned_cards_bleu: 0,
  turned_cards_rouge: 0
}

var cartes_mots = [];
var cartes_colors = [];


var listmots = [
  "Quartier","Corne","Bourse","Mineur","Cuisine","Trait",
  "Licorne","Cheval","Hollywood","Europe","Clé","Lunettes","Somme","Prêt",
  "Rayon","Boulet","Poire","Cycle","Farce","Grain","Ronde","Australie",
  "Napoléon","Figure","Meuble","Fer","Court","Étude","Kiwi","Carrière",
  "Portable","Couteau","Toile","Tokyo","Grèce","Canne","Passe","Facteur",
  "Paille","Orange","Course","Col","Ordre","Air","Prise","Bombe","Plateau",
  "Ampoule","Patron","Charge","Rame","Recette","Siège","But","Radio","Espagne",
  "Coq","Rouleau","Front","Lettre","Marron","Feuille","Gorge","Révolution",
  "Rome","Vision","Pièce","Talon","Commerce","Pile","Espace","Note",
  "Éponge","Charme","Volume","Perle","Marche","Manège","Mémoire","Vin",
  "Russie","Vol","Chef","Pendule","Don","Louche","Carreau","Botte",
  "Chaine","Tambour","Cellule","Tuile","Vaisseau","Pèche","Base",
  "Balance","Éclair","Plat","Canon","Atout","Barre","Cabinet","Club",
  "Vase","Droit","Gel","Garde","Banc","Guide","Essence","Cadre","Arc",
  "Cafard","Couronne","Carte","Planche","Opération","Enceinte","Grue",
  "Membre","Linge","Plan","Bar","Queue","Foyer","Pompe","Fin","Campagne",
  "Jet","Pensée","Baie","Entrée","Mine","Fuite","Formule","Titre","Cartouche",
  "Manche","Fraise","Voile","Ensemble","Partie","Poele","Carton","Moule","Ferme",
  "Glace","Bête","Iris","Vague","Critique","Physique","Avocat","Ninja","Londres",
  "Phare","Banane","Fort","Peste","Raie","Boite","Lumière","Astérix","New-York",
  "Alpes","Bon","Liquide","Choux","Solution","Bougie","Bouton","Brique","Grenade",
  "Mousse","Numéro","Coupe","Timbre","Couverture","Menu","Marque","Plante","Palme",
  "Langue","Sens","Majeur","Lentille","Asile","Sardine","Remise","Sortie","Lunette",
  "Bande","Palet","Tube","Lit","Bretelle","Poste","Chemise","Sol","Bureau","Religieuse",
  "Uniforme","Page"
];

function randMot(){
  while (true){
    var rand = Math.floor(Math.random() * (listmots.length - 1)) + 1;
    if (!isexist(cartes_mots, listmots[rand])){
      cartes_mots.push(listmots[rand]);
      break;
    }
  }
}

function isexist(array, mot){
  var nbr = 1;
  while (true){
    
    if (nbr == 26){
      return false;
      break;
    }else{
      //console.log("array[" + nbr + "] != " + array[nbr] + " != " + mot);
      if (array[nbr] == mot){
        //console.log("array[" + nbr + "] = " + array[nbr] + " = " + mot);
        return true;
        break;
      }
      nbr = nbr + 1;
    }
  }
}

function generatecolors(){

  var nbr = 1;
  while (nbr != 10){ //bleu
    cartes_colors[newNbr()] = colorBleu;
    ++nbr;
  }

  var nbr = 1;
  while (nbr != 9){ //rouge
    cartes_colors[newNbr()] = colorRouge;
    ++nbr;
  }

  var nbr = 1;
  while (nbr != 8){ //gris
    cartes_colors[newNbr()] = colorGris;
    ++nbr;
  }

  cartes_colors[newNbr()] = colorNoir;

}

function newNbr(){
  while (true){
    var rand = Math.floor(Math.random() * (26 - 1)) + 1;
    if (typeof cartes_colors[rand] == 'undefined') {
      return rand;
      break;
    }
  }
}
init();

io.on('connection', function(socket){
  
  console.log("Utilisateur connecté : " + socket.client.id);
  io.local.emit('user-connected', socket.client.id);
++infos.total_requests_nbr;
++infos.requests_nbr;
++infos.player_nbr;

  socket.on('disconnect', function(){
    console.log("Utilisateur déconnecté : " + socket.client.id);
    io.local.emit('user-disconnected', socket.client.id);
++infos.total_requests_nbr;
++infos.requests_nbr;
--infos.player_nbr;
  });
  
  socket.on('getcards', function(){
    console.log("Envoi des cartes au client : " + socket.client.id);
    
    io.local.emit('user-goto', {
      status: "devin",
      userid: socket.client.id
    });
++infos.total_requests_nbr;
++infos.requests_nbr;
    
    socket.emit('cartes', {
      mots: cartes_mots
    });
++infos.total_requests_nbr;
++infos.requests_nbr;
    if (infos.tour == "bleu"){
      io.local.emit('setbackcolor', colorBleu);
++infos.total_requests_nbr;
++infos.requests_nbr;
    }else{
      io.local.emit('setbackcolor', colorRouge);
++infos.total_requests_nbr;
++infos.requests_nbr;
    }
  });

  socket.on('getcards+colors', function(){
    console.log("Envoi des cartes au client : " + socket.client.id);
    io.local.emit('user-goto', {
      status: "espion",
      userid: socket.client.id
    });
++infos.total_requests_nbr;
++infos.requests_nbr;

    socket.emit('cartes+colors', {
      couleurs: cartes_colors,
      mots: cartes_mots
    });
++infos.total_requests_nbr;
++infos.requests_nbr;
    
    if (infos.tour == "bleu"){
      io.local.emit('setbackcolor', colorBleu);
++infos.total_requests_nbr;
++infos.requests_nbr;
    }else{
      io.local.emit('setbackcolor', colorRouge);
++infos.total_requests_nbr;
++infos.requests_nbr;
    }
    
  });

  socket.on('next-tour', function(){
    var newcolor;
    if (infos.tour == "bleu"){
      newcolor = colorRouge;
      infos.tour = "rouge"
    }else{
      newcolor = colorBleu;
      infos.tour = "bleu";
    }
    io.local.emit('setbackcolor', newcolor);
++infos.total_requests_nbr;
++infos.requests_nbr;
  });

  socket.on('turn-card', function(data){
    var data_nbr = data.nbr;
    
    if (cartes_colors[data_nbr] != colorNoir){
      if (cartes_colors[data_nbr] == colorBleu){
        ++infos.turned_cards_bleu;
        if (infos.turned_cards_bleu == 9){
          io.local.emit('end', {
            msg : "L'équipe bleue a gagné !",
            nbr: data_nbr,
            color: colorBleu
          });
++infos.total_requests_nbr;
++infos.requests_nbr;
          init();
        }else{
          io.local.emit('carteturned', {
            nbr: data_nbr,
            color: colorBleu
          });
++infos.total_requests_nbr;
++infos.requests_nbr;
        }
      }else if (cartes_colors[data_nbr] == colorRouge){
        ++infos.turned_cards_rouge;
        if (infos.turned_cards_rouge == 8){
          io.local.emit('end', {
            msg : "L'équipe rouge a gagné !",
            nbr: data_nbr,
            color: colorRouge
          });
++infos.total_requests_nbr;
++infos.requests_nbr;
          init();
        }else{
          io.local.emit('carteturned', {
            nbr: data_nbr,
            color: colorRouge
          });
++infos.total_requests_nbr;
++infos.requests_nbr;
        }
      }else{
        io.local.emit('carteturned', {
          nbr: data_nbr,
          color: colorGris
        });
++infos.total_requests_nbr;
++infos.requests_nbr;
      }
      
    }else{
      io.local.emit('end', {
        msg : "L'équipe " + infos.tour + " a perdu !",
        nbr: data_nbr,
        color: colorNoir
      });
++infos.total_requests_nbr;
++infos.requests_nbr;
      init();
    }
  });

  socket.on('paing', function ( fn ) {
    infos.workingTime = Date.now() - infos.startDate;
++infos.total_requests_nbr;
    fn(infos);
  });

  socket.on('admin-assignuser', function(data){
    socket.to(data.userid).emit("goto", data.page);
++infos.total_requests_nbr;
++infos.requests_nbr;
  });

  socket.on('reload-serveur', function(){
    io.local.emit('reload-serveur');
++infos.total_requests_nbr;
++infos.requests_nbr;
    init();
  });

  socket.on('stop', function(){
    io.local.emit('stop');
++infos.total_requests_nbr;
++infos.requests_nbr;
    process.exit();
  });

  socket.on('forcedisconnect', function(){
    socket.disconnect();
  });
  
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

function init(){
  
  console.log("---------------------Demarrage---------------------");

  infos.tour = "bleu";
  infos.turned_cards_bleu   = 0;
  infos.turned_cards_rouge  = 0;

  cartes_mots = [];
  cartes_colors = [];

  var nbr = 1;
  while (nbr != 27){
    randMot();
    ++nbr;
  }

  generatecolors();
}