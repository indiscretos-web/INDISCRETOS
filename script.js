// INDISCRETOS — versión conectada a Supabase
(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const STORAGE_KEY = "indiscretos_v2_data";
  const SUPABASE_URL = "https://akrwawkfazuopkxxitzs.supabase.co";
  const SUPABASE_KEY = "sb_publishable_q3E2D87zvkwBiLVygIwdtA_RpK3q1Fd";

  let db = null;
  let usuario = null;
  let datos = { grupoId: null, posts: [], reportes: [] };
  let fotoSeleccionada = "";
  let toastTimer;
  const comentariosAbiertos = new Set();
  let idsPublicacionesConocidas = null;
  const publicacionesTruenoEscuchadas = new Set();

  const escuelas = [
    { id:"rivadavia", nombre:'Colegio N° 1 D.E. 3 "Bernardino Rivadavia"', direccion:"Av. San Juan 1545, Constitución, CABA", mapa:"Av. San Juan 1545, Constitución, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"sarmiento", nombre:'Colegio N° 2 D.E. 1 "Domingo Faustino Sarmiento"', direccion:"Libertad 1257, Retiro", mapa:"Libertad 1257, Retiro, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"moreno", nombre:'Colegio N° 3 D.E. 2 "Mariano Moreno"', direccion:"Av. Rivadavia 3577, Almagro", mapa:"Av. Rivadavia 3577, Almagro, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"avellaneda", nombre:'Colegio N° 4 D.E. 9 "Nicolás Avellaneda"', direccion:"El Salvador 5528, Palermo", mapa:"El Salvador 5528, Palermo, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"pueyrredon", nombre:'Colegio N° 7 D.E. 3 "Juan Martín de Pueyrredón"', direccion:"Chacabuco 922, San Telmo", mapa:"Chacabuco 922, San Telmo, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"roca", nombre:'Colegio N° 8 D.E. 10 "Julio A. Roca"', direccion:"Conesa 3142, Belgrano", mapa:"Conesa 3142, Belgrano, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"san-martin", nombre:'Colegio N° 10 D.E. 8 "José de San Martín"', direccion:"Av. Chiclana 4043, Balvanera", mapa:"Av. Chiclana 4043, Balvanera, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"espora", nombre:'Colegio N° 13 D.E. 18 "Cnel. de Marina Tomás Espora"', direccion:"Av. Álvarez Jonte 5075, Monte Castro", mapa:"Av. Álvarez Jonte 5075, Monte Castro, Ciudad Autónoma de Buenos Aires, Argentina" },
    { id:"escuela-del-sol", nombre:"Escuela del Sol", direccion:"C. 125 659", mapa:"C. 125 659, Buenos Aires, Argentina" },
    { id:"ees-41", nombre:"EES N.º 41", direccion:"C. 24 3187", mapa:"C. 24 3187, Buenos Aires, Argentina" },
    { id:"secundaria-38", nombre:"Escuela Secundaria N.º 38", direccion:"C. 9 3151", mapa:"C. 9 3151, Buenos Aires, Argentina" }
  ];

  const logros = [
    { id:"feed", icono:"👀", titulo:"Nuevo en el chisme", descripcion:"Entrá al Feed de Indiscretos.", premio:"Insignia Nuevo en el chisme" },
    { id:"primera", icono:"🥈", titulo:"Indiscreto aprendiz", descripcion:"Compartí tu primera publicación.", premio:"Insignia Primer Paso" },
    { id:"comentario", icono:"💬", titulo:"Indiscreto recluta", descripcion:"Dejá tu primer comentario.", premio:"Insignia Recluta" },
    { id:"tres", icono:"🏆", titulo:"ÉLITE", descripcion:"Publicá 3 mensajes.", premio:"Título ÉLITE" },
    { id:"cincoLikes", icono:"✨", titulo:"INDISCRETO PREMIUM", descripcion:"Conseguí 5 likes en una publicación.", premio:"Título Premium rojo" },
    { id:"cincoComentarios", icono:"🩵", titulo:"INDISCRETO CLASE C", descripcion:"Escribí 5 comentarios.", premio:"Título celeste" },
    { id:"cincoPosts", icono:"💚", titulo:"INDISCRETO CLASE B", descripcion:"Llegá a 5 publicaciones.", premio:"Título verde claro" },
    { id:"diezLikes", icono:"🟠", titulo:"INDISCRETO CLASE A", descripcion:"Conseguí 10 likes entre tus publicaciones.", premio:"Título naranja" },
    { id:"diezPosts", icono:"💜", titulo:"INDISCRETO ABSOLUTE", descripcion:"Llegá a 10 publicaciones.", premio:"Título lila" },
    { id:"trueno", icono:"⚡", titulo:"PODER DEL TRUENO", descripcion:"Llegá a 10 publicaciones y 20 likes en total.", premio:"Tema azul y celeste exclusivo, publicaciones eléctricas y sonido de trueno para todos" }
  ];

  function sonido(tipo = "click") {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const notas = {
        click:[[520,.055,"square"]],
        publicar:[[440,.08,"triangle"],[660,.09,"triangle"],[880,.12,"triangle"]],
        like:[[660,.06,"sine"],[880,.09,"sine"]],
        grupo:[[392,.08,"square"],[587,.08,"square"],[784,.13,"square"]],
        logro:[[523,.08,"triangle"],[659,.08,"triangle"],[784,.08,"triangle"],[1046,.16,"triangle"]],
        foto:[[740,.045,"square"],[988,.07,"square"]],
        reporte:[[330,.1,"sawtooth"],[220,.14,"sawtooth"]],
        error:[[260,.1,"square"],[190,.12,"square"]],
        salir:[[660,.07,"square"],[440,.1,"square"]],
        trueno:[[95,.24,"sawtooth"],[62,.3,"triangle"],[130,.22,"sawtooth"],[48,.38,"triangle"]]
      }[tipo] || [[520,.055,"square"]];

      let t = ctx.currentTime;
      notas.forEach(([f,d,w]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = w;
        osc.frequency.setValueAtTime(f,t);
        gain.gain.setValueAtTime(.0001,t);
        gain.gain.exponentialRampToValueAtTime(.07,t+.012);
        gain.gain.exponentialRampToValueAtTime(.0001,t+d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t+d+.015);
        t += d*.82;
      });
      setTimeout(() => ctx.close().catch(()=>{}),900);
    } catch (_) {}
  }

  function avisar(mensaje) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"),2800);
  }

  function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g,c=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[c]);
  }

  function normalizar(texto) {
    return String(texto || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  }

  function escuelaPorId(id) {
    return escuelas.find(e=>e.id===id);
  }

  function tieneGrupo() {
    return Boolean(escuelaPorId(datos.grupoId));
  }

  function guardarLocal() {
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify({
        grupoId:datos.grupoId,
        posts:datos.posts,
        reportes:datos.reportes
      }));
      return true;
    } catch (_) {
      avisar("No se pudo guardar en este navegador.");
      return false;
    }
  }

  function cargarLocal() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (d) {
        datos.grupoId = d.grupoId || null;
        datos.posts = Array.isArray(d.posts) ? d.posts : [];
        datos.reportes = Array.isArray(d.reportes) ? d.reportes : [];
      }
    } catch (_) {}
  }

  async function conectar() {
    if (db && usuario) return;
    if (!window.supabase?.createClient) {
      await new Promise((resolve,reject)=>{
        const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload=resolve;
        s.onerror=()=>reject(new Error("No se pudo cargar Supabase."));
        document.head.appendChild(s);
      });
    }

    db = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const sesion = await db.auth.getSession();
    if (sesion.error) throw sesion.error;

    if (sesion.data.session) {
      usuario = sesion.data.session.user;
    } else {
      const resultado = await db.auth.signInAnonymously();
      if (resultado.error) throw resultado.error;
      usuario = resultado.data.user;
    }
  }

  async function cargarRemoto(mostrarError = false) {
    try {
      await conectar();

      const respuesta = await db.from("posts")
        .select("*").order("created_at",{ascending:false}).limit(200);
      if (respuesta.error) throw respuesta.error;

      const remotos = respuesta.data || [];
      const ids = remotos.map(p=>p.id);
      let likes = [];
      let comentarios = [];

      if (ids.length) {
        // Likes y comentarios de publicaciones se consultan en paralelo para acelerar el primer render.
        const [lr, crInicial] = await Promise.all([
          db.from("post_likes").select("post_id,user_id").in("post_id",ids),
          db.from("post_comments")
            .select("id,post_id,user_id,content,created_at,parent_comment_id,school_id")
            .in("post_id",ids).order("created_at",{ascending:true})
        ]);
        if (lr.error) throw lr.error;
        likes = lr.data || [];

        let cr = crInicial;
        // Compatibilidad con instalaciones que aún no tienen respuestas anidadas.
        if (cr.error) {
          cr = await db.from("post_comments")
            .select("id,post_id,user_id,content,created_at")
            .in("post_id",ids).order("created_at",{ascending:true});
        }
        if (cr.error) {
          console.warn("Comentarios no disponibles; el muro seguirá cargando.", cr.error);
        } else {
          comentarios = (cr.data || []).map(c=>({...c,parent_comment_id:c.parent_comment_id || null}));
        }
      }

      let likesComentarios = [];
      const idsComentarios = comentarios.map(c=>c.id);
      if (idsComentarios.length) {
        try {
          const lcr = await db.from("post_comment_likes")
            .select("comment_id,user_id").in("comment_id",idsComentarios);
          if (lcr.error) throw lcr.error;
          likesComentarios = lcr.data || [];
        } catch (errorLikesComentarios) {
          console.warn("Likes de comentarios no disponibles; ejecutá supabase-comment-replies-likes.sql.", errorLikesComentarios);
        }
      }

      datos.posts = remotos.map(p=>{
        let contenido = {};
        try {
          contenido = JSON.parse(p.content || "{}");
        } catch (_) {
          contenido = { texto:p.content || "" };
        }
        const likesPost = likes.filter(l=>String(l.post_id)===String(p.id));
        return {
          id:p.id,
          autorId:p.user_id || null,
          grupoId:p.school_id || null,
          tipo:p.school_id ? "grupo" : "publico",
          titulo:p.title || contenido.titulo || "",
          texto:contenido.texto ?? p.content ?? "",
          poderTrueno:Boolean(contenido.poderTrueno),
          foto:p.image_url || "",
          likes:likesPost.length,
          liked:likesPost.some(l=>l.user_id===usuario.id),
          comentarios:comentarios.filter(c=>String(c.post_id)===String(p.id)).map(c=>{
            const likesComentario = likesComentarios.filter(l=>String(l.comment_id)===String(c.id));
            return {
              ...c,
              likes:likesComentario.length,
              liked:likesComentario.some(l=>l.user_id===usuario.id)
            };
          }),
          creado:p.created_at
        };
      });

      const idsActuales = new Set(datos.posts.map(p=>String(p.id)));
      if (idsPublicacionesConocidas !== null) {
        datos.posts.forEach(p=>{
          if (!idsPublicacionesConocidas.has(String(p.id)) && p.poderTrueno) reproducirTruenoUnaVez(p.id);
        });
      }
      idsPublicacionesConocidas = idsActuales;

      dibujarTodo();
    } catch (error) {
      console.error("Supabase:",error);
      if (mostrarError) avisar("No se pudo conectar. Revisá la configuración de Supabase.");
    }
  }

  async function publicarRemoto({titulo,texto,foto="",grupoId=null}) {
    await conectar();
    const estadoLogros = estadosLogros();
    const r = await db.from("posts").insert({
      user_id:usuario.id,
      author_name:"Anónimo",
      title:titulo,
      content:JSON.stringify({texto,poderTrueno:Boolean(estadoLogros.trueno)}),
      image_url:foto || null,
      school_id:grupoId || null
    });
    if (r.error) throw r.error;
    await cargarRemoto();
  }

  async function agregarComentario(postId, texto, parentCommentId = null) {
    const posicionScroll = window.scrollY;
    comentariosAbiertos.add(String(postId));
    await conectar();
    const contenido = String(texto || "").trim();
    if (!contenido) throw new Error("El comentario está vacío.");
    if (contenido.length > 500) throw new Error("El comentario supera los 500 caracteres.");

    const nuevoComentario = {
      post_id:postId,
      user_id:usuario.id,
      content:contenido,
      school_id:datos.grupoId || null
    };
    if (parentCommentId !== null) nuevoComentario.parent_comment_id = parentCommentId;

    const r = await db.from("post_comments").insert(nuevoComentario);
    if (r.error) throw r.error;
    await cargarRemoto();
    requestAnimationFrame(() => window.scrollTo({top:posicionScroll, behavior:"auto"}));
  }

  async function cambiarLikeComentario(comentario) {
    await conectar();
    const encontrado = await db.from("post_comment_likes")
      .select("comment_id")
      .eq("comment_id",comentario.id)
      .eq("user_id",usuario.id)
      .maybeSingle();
    if (encontrado.error) throw encontrado.error;

    if (encontrado.data) {
      const r = await db.from("post_comment_likes").delete()
        .eq("comment_id",comentario.id)
        .eq("user_id",usuario.id);
      if (r.error) throw r.error;
    } else {
      const r = await db.from("post_comment_likes").insert({
        comment_id:comentario.id,
        user_id:usuario.id
      });
      if (r.error) throw r.error;
    }
    await cargarRemoto();
  }

  async function cambiarLike(post) {
    await conectar();
    const encontrado = await db.from("post_likes")
      .select("post_id").eq("post_id",post.id)
      .eq("user_id",usuario.id).maybeSingle();
    if (encontrado.error) throw encontrado.error;

    if (encontrado.data) {
      const r = await db.from("post_likes").delete()
        .eq("post_id",post.id).eq("user_id",usuario.id);
      if (r.error) throw r.error;
    } else {
      if (Number(post.likes) >= 40) {
        const error = new Error("MAX_LIKES");
        throw error;
      }
      const r = await db.from("post_likes").insert({
        post_id:post.id,user_id:usuario.id
      });
      if (r.error) throw r.error;
    }
    await cargarRemoto();
  }

  function crearMapa(e) {
    const a=document.createElement("a");
    a.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(e.mapa);
    a.target="_blank";
    a.rel="noopener noreferrer";
    a.className="map-link";
    a.textContent="📍 Ver ubicación en Google Maps";
    a.addEventListener("click",()=>sonido("click"));
    return a;
  }

  function cambiarVista(vista) {
    document.querySelectorAll(".view").forEach(e=>e.classList.add("hidden"));
    const seleccionada=$("#view-"+vista);
    if (seleccionada) seleccionada.classList.remove("hidden");
    document.querySelectorAll(".nav-btn").forEach(b=>{
      b.classList.toggle("active",b.dataset.view===vista);
    });
    $("#sidebar")?.classList.remove("open");
    if (vista==="colegios") dibujarEscuelas();
    if (vista==="inicio") localStorage.setItem("indiscretos_feed_visitado","1");
    if (vista==="logros") dibujarLogros();
  }

  document.querySelectorAll("[data-view]").forEach(b=>{
    b.addEventListener("click",ev=>{
      ev.preventDefault();
      sonido("click");
      cambiarVista(b.dataset.view);
    });
  });

  function actualizarGrupo() {
    const e=escuelaPorId(datos.grupoId);
    const etiquetaGrupo=$("#myGroup");
    if (etiquetaGrupo) etiquetaGrupo.textContent=e ? `🏫 ${e.nombre}` : "Todavía no elegiste un grupo.";
    const navColegio=$("#joinedSchoolNav");
    const navNombre=$("#joinedSchoolNavButton");
    if (navColegio) navColegio.classList.toggle("hidden",!e);
    if (navNombre && e) navNombre.textContent="🏫 "+e.nombre;
    $("#groupNotice")?.classList.add("hidden");
    // El formulario permanece visible, pero cualquier intento sin colegio lleva a la selección.
    $("#postText").readOnly=!e;
    $("#postImage").disabled=!e;
    $("#publishBtn").disabled=false;
    if ($("#postText")) {
      $("#postText").placeholder=e
        ? "Escribí algo para compartir con toda la comunidad..."
        : "Unite a un colegio para interactuar en Indiscretos.";
    }
    $("#postForm")?.classList.toggle("needs-school",!e);
    dibujarFeed();
  }

  function salirGrupo(pedirConfirmacion = true) {
    if (!tieneGrupo()) {
      datos.grupoId=null;
      guardarLocal();
      actualizarGrupo();
      dibujarEscuelas();
      return;
    }
    if (pedirConfirmacion && !confirm("¿Querés salir de tu colegio actual?")) return;
    datos.grupoId=null;
    guardarLocal();
    actualizarGrupo();
    dibujarGrupo();
    dibujarEscuelas();
    cambiarVista("colegios");
    avisar("Saliste del colegio. Ahora podés elegir otro.");
  }

  function entrarGrupo(id) {
    const e=escuelaPorId(id);
    if (!e) {
      datos.grupoId=null;
      guardarLocal();
      dibujarEscuelas();
      avisar("Ese colegio ya no está disponible. Elegí uno de la lista.");
      return;
    }
    if (tieneGrupo()) {
      sonido("error");
      avisar("Primero salí de tu colegio actual usando el botón «Salir del colegio».");
      return;
    }
    // Guardar primero la selección y actualizar la navegación sin depender de elementos antiguos.
    datos.grupoId=e.id;
    guardarLocal();
    actualizarGrupo();
    dibujarEscuelas();
    dibujarGrupo();
    cambiarVista("inicio");
    // Reforzar la visibilidad y el nombre del colegio tras cambiar de vista.
    const navColegio=$("#joinedSchoolNav");
    const navNombre=$("#joinedSchoolNavButton");
    if (navColegio) navColegio.classList.remove("hidden");
    if (navNombre) navNombre.textContent="🏫 "+e.nombre;
    const mensaje=$("#schoolJoinNotice");
    if (mensaje) mensaje.classList.add("hidden");
    sonido("grupo");
    avisar(`¡Te uniste a ${e.nombre}!`);
  }

  $("#changeGroupBtn")?.addEventListener("click",()=>salirGrupo(true));
  $("#navLeaveGroupBtn")?.addEventListener("click",()=>{
    sonido("salir");
    salirGrupo(true);
  });

  function dibujarEscuelas(filtro = $("#schoolSearch")?.value || "") {
    const lista=$("#schoolList");
    if (!lista) return;
    lista.replaceChildren();
    const resultados=escuelas.filter(e=>normalizar(e.nombre+" "+e.direccion).includes(normalizar(filtro)));

    if (!resultados.length) {
      lista.innerHTML='<div class="empty-state">🔎 No encontramos ese colegio.</div>';
      return;
    }

    resultados.forEach(e=>{
      const actual=String(datos.grupoId||"")===String(e.id);
      const ocupado=tieneGrupo()&&!actual;
      const tarjeta=document.createElement("article");
      tarjeta.className="school-card";
      const emoji=document.createElement("div");
      emoji.className="school-emoji";
      emoji.textContent="🏫";
      const info=document.createElement("div");
      info.className="school-info";
      const nombre=document.createElement("h3");
      nombre.textContent=e.nombre;
      const direccion=document.createElement("p");
      direccion.textContent="📍 "+e.direccion;
      const estado=document.createElement("p");
      estado.textContent=actual?"✓ Estás unido a este colegio":ocupado?"Salí de tu colegio actual para cambiar.":"Unite para participar en este colegio.";
      info.append(nombre,direccion,crearMapa(e),estado);
      const boton=document.createElement("button");
      boton.className=actual?"secondary-btn":"primary-btn";
      boton.textContent=actual?"Salir del colegio":"Entrar";
      boton.disabled=ocupado;
      if (actual) {
        boton.addEventListener("click",()=>salirGrupo(true));
      } else if (!ocupado) {
        boton.addEventListener("click",()=>entrarGrupo(e.id));
      }
      tarjeta.append(emoji,info,boton);
      lista.append(tarjeta);
    });
  }

  $("#schoolSearch")?.addEventListener("input",ev=>dibujarEscuelas(ev.target.value));

  
if ($("#postForm") && $("#postText") && !$("#postTitle")) {
  const tituloInput = document.createElement("input");
  tituloInput.id = "postTitle";
  tituloInput.type = "text";
  tituloInput.maxLength = 90;
  tituloInput.placeholder = "Poné un título que llame la atención...";
  tituloInput.setAttribute("aria-label", "Título de la publicación");
  tituloInput.className = "post-title-input";

    $("#postForm").insertBefore(tituloInput, $("#postText"));
}

$("#postImage")?.addEventListener("change", ev => {
    const archivo=ev.target.files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      sonido("error"); avisar("Elegí una imagen válida."); ev.target.value=""; return;
    }
    if (archivo.size>3*1024*1024) {
      sonido("error"); avisar("La foto debe pesar menos de 3 MB."); ev.target.value=""; return;
    }
    const lector=new FileReader();
    lector.onload=()=>{
      sonido("foto");
      fotoSeleccionada=lector.result;
      $("#previewImage").src=fotoSeleccionada;
      $("#imagePreview").classList.remove("hidden");
    };
    lector.onerror=()=>avisar("No se pudo leer la foto.");
    lector.readAsDataURL(archivo);
  });

  function quitarFoto() {
    if (fotoSeleccionada) sonido("click");
    fotoSeleccionada="";
    if ($("#postImage")) $("#postImage").value="";
    $("#previewImage")?.removeAttribute("src");
    $("#imagePreview")?.classList.add("hidden");
  }

  $("#removeImage")?.addEventListener("click",quitarFoto);
  $("#postText")?.addEventListener("input",()=>{
    $("#charCount").textContent=`${$("#postText").value.length}/1000`;
  });

  function pedirColegio() {
    cambiarVista("colegios");
    const mensaje=$("#schoolJoinNotice");
    if (mensaje) {
      mensaje.textContent="Unite a un colegio para interactuar en Indiscretos.";
      mensaje.classList.remove("hidden");
    }
  }

  $("#postForm")?.addEventListener("click",ev=>{
    if (!tieneGrupo() && (ev.target.closest("#postText, #postImage, .upload-btn, #publishBtn, #postTitle"))) {
      pedirColegio();
    }
  });

  $("#postForm")?.addEventListener("submit",async ev=>{
    ev.preventDefault();
    if (!tieneGrupo()) {
      pedirColegio();
      return;
    }
    const titulo=$("#postTitle").value.trim();
    const texto=$("#postText").value.trim();

    if (!titulo) {
      sonido("error"); avisar("Poné un título para tu publicación.");
      $("#postTitle").focus(); return;
    }
    if (!texto&&!fotoSeleccionada) {
      sonido("error"); avisar("Escribí algo o agregá una foto."); return;
    }

    $("#publishBtn").disabled=true;
    try {
      await publicarRemoto({titulo,texto,foto:fotoSeleccionada,grupoId:datos.grupoId});
      $("#postTitle").value="";
      $("#postText").value="";
      $("#charCount").textContent="0/1000";
      quitarFoto();
      sonido("publicar");
      avisar("¡Publicación compartida con todos! 💬");
    } catch (error) {
      console.error(error);
      sonido("error");
      avisar("No se pudo publicar. Revisá Supabase y sus políticas.");
    } finally {
      $("#publishBtn").disabled=false;
    }
  });

  function fechaBonita(fecha) {
    const d=new Date(fecha);
    if (Number.isNaN(d.getTime())) return "Hace un rato";
    return d.toLocaleString("es-AR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  }

  function misPublicaciones() {
    return datos.posts.filter(p=>p.autorId && usuario && p.autorId===usuario.id);
  }

  function estadosLogros() {
    const mias=misPublicaciones();
    const comentariosMios=datos.posts.flatMap(p=>p.comentarios||[]).filter(c=>c.user_id && usuario && c.user_id===usuario.id);
    const totalLikes=mias.reduce((total,p)=>total+(Number(p.likes)||0),0);
    const estado={
      feed:localStorage.getItem("indiscretos_feed_visitado")==="1",
      primera:mias.length>=1,
      comentario:comentariosMios.length>=1,
      tres:mias.length>=3,
      cincoLikes:mias.some(p=>Number(p.likes)>=5),
      cincoComentarios:comentariosMios.length>=5,
      cincoPosts:mias.length>=5,
      diezLikes:totalLikes>=10,
      diezPosts:mias.length>=10,
      trueno:mias.length>=10 && totalLikes>=20
    };
    return estado;
  }

  function actualizarTemaTrueno() {
    document.body.classList.toggle("thunder-theme",Boolean(estadosLogros().trueno));
  }

  function construirArbolComentarios(comentarios) {
    const porId = new Map();
    comentarios.forEach(c=>porId.set(String(c.id),{...c,respuestas:[]}));
    const raices = [];
    porId.forEach(c=>{
      const padre = c.parent_comment_id !== null && c.parent_comment_id !== undefined
        ? porId.get(String(c.parent_comment_id))
        : null;
      if (padre) padre.respuestas.push(c);
      else raices.push(c);
    });
    return raices;
  }

  function crearFormularioComentario(postId, parentCommentId) {
    const formulario=document.createElement("form");
    formulario.className="comment-form";
    const entrada=document.createElement("textarea");
    entrada.name="comentario";
    entrada.maxLength=500;
    entrada.rows=2;
    entrada.placeholder=parentCommentId===null
      ? "Escribí un comentario (máx. 500 caracteres)..."
      : "Escribí tu respuesta (máx. 500 caracteres)...";
    entrada.setAttribute("aria-label",parentCommentId===null?"Escribir comentario":"Escribir respuesta");
    entrada.required=true;
    entrada.addEventListener("focus",()=>{
      if (!tieneGrupo()) pedirColegio();
    });
    entrada.addEventListener("click",()=>{
      if (!tieneGrupo()) pedirColegio();
    });
    const boton=document.createElement("button");
    boton.type="submit";
    boton.className="secondary-btn comment-submit";
    boton.textContent=parentCommentId===null?"Enviar comentario":"Enviar respuesta";
    formulario.append(entrada,boton);
    formulario.addEventListener("submit",async ev=>{
      ev.preventDefault();
      if (!tieneGrupo()) {
        pedirColegio();
        return;
      }
      const texto=entrada.value.trim();
      if (!texto) return;
      boton.disabled=true;
      try {
        await agregarComentario(postId,texto,parentCommentId);
        sonido("publicar");
        avisar(parentCommentId===null?"¡Comentario publicado de forma anónima! 💬":"¡Respuesta publicada de forma anónima! 💬");
      } catch(error) {
        console.error(error);
        sonido("error");
        avisar("No se pudo guardar. Ejecutá la actualización SQL de comentarios y revisá las políticas.");
      } finally {
        boton.disabled=false;
      }
    });
    return formulario;
  }

  function dibujarComentario(comentario, postId) {
    const item=document.createElement("article");
    item.className="comment-item";
    const autor=document.createElement("strong");
    autor.textContent="🎭 Anónimo";
    item.append(autor);
    const escuelaComentario=escuelaPorId(comentario.school_id);
    if (escuelaComentario) {
      const etiquetaEscuela=document.createElement("div");
      etiquetaEscuela.className="school-tag";
      etiquetaEscuela.textContent="🏫 "+escuelaComentario.nombre;
      item.append(etiquetaEscuela);
    }
    const texto=document.createElement("p");
    texto.textContent=comentario.content || "";
    const fecha=document.createElement("small");
    fecha.textContent=fechaBonita(comentario.created_at);
    item.append(texto,fecha);

    const acciones=document.createElement("div");
    acciones.className="comment-actions";
    const like=document.createElement("button");
    like.type="button";
    like.className=`comment-like-btn${comentario.liked?" liked":""}`;
    like.textContent=`${comentario.liked?"❤️":"🤍"} ${Number(comentario.likes)||0}`;
    like.setAttribute("aria-label",comentario.liked?"Quitar like al comentario":"Dar like al comentario");
    like.addEventListener("click",async()=>{
      like.disabled=true;
      try {
        await cambiarLikeComentario(comentario);
        sonido("like");
      } catch(error) {
        console.error(error);
        sonido("error");
        avisar("No se pudo dar like al comentario. Ejecutá la actualización SQL y probá de nuevo.");
      } finally {
        like.disabled=false;
      }
    });

    const responder=document.createElement("button");
    responder.type="button";
    responder.className="comment-reply-btn";
    responder.textContent="↩ Responder";
    responder.addEventListener("click",()=>{
      if (!tieneGrupo()) {
        pedirColegio();
        return;
      }
      let formulario=item.querySelector(":scope > .comment-form");
      if (formulario) {
        formulario.remove();
        responder.textContent="↩ Responder";
      } else {
        formulario=crearFormularioComentario(postId,comentario.id);
        item.append(formulario);
        responder.textContent="Cancelar respuesta";
        formulario.querySelector("textarea")?.focus();
      }
    });
    acciones.append(like,responder);
    item.append(acciones);

    if (comentario.respuestas?.length) {
      const respuestas=document.createElement("div");
      respuestas.className="comment-replies";
      comentario.respuestas.forEach(r=>respuestas.append(dibujarComentario(r,postId)));
      item.append(respuestas);
    }
    return item;
  }

  function etiquetasDeAutor(autorId) {
    if (!autorId) return [];
    const publicaciones = datos.posts.filter(p=>p.autorId===autorId);
    const comentarios = datos.posts
      .flatMap(p=>p.comentarios||[])
      .filter(c=>c.user_id===autorId).length;
    const totalLikes = publicaciones.reduce((n,p)=>n+(Number(p.likes)||0),0);
    const etiquetas = [];
    if (publicaciones.length >= 1) etiquetas.push({texto:"APRENDIZ",clase:"tag-aprendiz"});
    if (comentarios >= 1) etiquetas.push({texto:"RECLUTA",clase:"tag-recluta"});
    if (publicaciones.length >= 3) etiquetas.push({texto:"ÉLITE",clase:"tag-elite"});
    if (publicaciones.some(p=>Number(p.likes)>=5)) etiquetas.push({texto:"PREMIUM",clase:"tag-premium"});
    if (comentarios >= 5) etiquetas.push({texto:"CLASE C",clase:"tag-clase-c"});
    if (publicaciones.length >= 5) etiquetas.push({texto:"CLASE B",clase:"tag-clase-b"});
    if (totalLikes >= 10) etiquetas.push({texto:"CLASE A",clase:"tag-clase-a"});
    if (publicaciones.length >= 10) etiquetas.push({texto:"ABSOLUTE",clase:"tag-absolute"});
    if (publicaciones.length >= 10 && totalLikes >= 20) etiquetas.push({texto:"⚡ PODER DEL TRUENO",clase:"tag-trueno"});
    return etiquetas;
  }

  function crearPost(post) {
    const e=escuelaPorId(post.grupoId);
    const articulo=document.createElement("article");
    const autorTieneTrueno=Boolean(post.autorId && datos.posts.some(p=>p.autorId===post.autorId && p.poderTrueno));
    articulo.className="post-card"+(autorTieneTrueno?" thunder-post":"");
    if (autorTieneTrueno) articulo.setAttribute("data-power","PODER DEL TRUENO");
    const cabecera=document.createElement("div");
    cabecera.className="post-header";
    const avatar=document.createElement("div");
    avatar.className="anonymous-avatar";
    avatar.textContent="🎭";
    const identidad=document.createElement("div");
    const autor=document.createElement("div");
    autor.className="post-author";
    autor.textContent="Publicado por Anónimo";
    const etiquetasAutor = document.createElement("span");
    etiquetasAutor.className="author-achievement-tags";
    etiquetasDeAutor(post.autorId).forEach(item=>{
      const insignia=document.createElement("span");
      insignia.className="author-achievement-tag "+item.clase;
      insignia.textContent=item.texto;
      insignia.title="Logro desbloqueado";
      etiquetasAutor.append(insignia);
    });
    const fecha=document.createElement("div");
    fecha.className="post-meta";
    fecha.textContent=fechaBonita(post.creado);
    const etiqueta=document.createElement("div");
    etiqueta.className="school-tag";
    etiqueta.textContent=post.tipo==="grupo"&&e?`🌎 Feed · 🏫 ${e.nombre}`:"🌎 Publicación pública";
    if (etiquetasAutor.childElementCount) autor.append(etiquetasAutor);
    identidad.append(autor,fecha,etiqueta);
    cabecera.append(avatar,identidad);
    articulo.append(cabecera);

    if (post.titulo) {
      const h=document.createElement("h3");
      h.className="post-title";
      h.textContent=post.titulo;
      articulo.append(h);
    }

    if (post.texto) {
      const burbuja=document.createElement("div");
      burbuja.className="post-bubble";
      if (autorTieneTrueno) {
        burbuja.classList.add("thunder-bubble");
        burbuja.textContent=post.texto;
      } else if (Number(post.likes)>=20) {
        burbuja.classList.add("premium-bubble");
        burbuja.innerHTML=escapar(post.texto).split(/(\s+)/)
          .map(w=>/^\s+$/.test(w)?w:`<span class="premium-word">${w}</span>`).join("");
      } else burbuja.textContent=post.texto;
      articulo.append(burbuja);
    }

    if (post.foto) {
      const img=document.createElement("img");
      img.className="post-image";
      img.src=post.foto;
      img.alt="Foto compartida en la publicación";
      img.loading="lazy";
      articulo.append(img);
    }

    const acciones=document.createElement("div");
    acciones.className="post-actions";
    const like=document.createElement("button");
    like.className=`like-btn${post.liked?" liked":""}`;
    like.textContent=`${post.liked?"❤️":"🤍"} ${Number(post.likes)||0} likes`;
    like.disabled = Number(post.likes) >= 40 && !post.liked;
    if (like.disabled) like.title = "Esta publicación llegó al máximo de 40 likes";
    like.addEventListener("click",async()=>{
      like.disabled=true;
      try {
        await cambiarLike(post);
        sonido("like");
      } catch (error) {
        if (error?.message === "MAX_LIKES") {
          avisar("Esta publicación ya llegó al máximo de 40 likes.");
        } else {
          console.error(error);
          sonido("error");
          avisar("No se pudo guardar el like. Probá de nuevo.");
        }
      } finally {
        like.disabled = Number(post.likes) >= 40 && !post.liked;
      }
    });

    const reportar=document.createElement("button");
    reportar.className="report-btn";
    reportar.textContent="⚑ Reportar";
    reportar.addEventListener("click",()=>{
      sonido("reporte");
      if (!confirm("¿Querés reportar esta publicación?")) return;
      if (!datos.reportes.includes(post.id)) datos.reportes.push(post.id);
      guardarLocal();
      avisar("Reporte guardado en este navegador; todavía no se envía a un administrador.");
    });
    acciones.append(like,reportar);
    articulo.append(acciones);

    const zonaComentarios=document.createElement("section");
    zonaComentarios.className="comments-area";
    const comentariosPost=post.comentarios || [];
    const arbolComentarios=construirArbolComentarios(comentariosPost);
    const contarComentarios = lista => lista.reduce((n,c)=>n+1+contarComentarios(c.respuestas || []),0);
    const totalComentarios=contarComentarios(arbolComentarios);
    const tituloComentarios=document.createElement("button");
    tituloComentarios.type="button";
    tituloComentarios.className="comments-toggle";
    const comentariosAbiertosAhora = comentariosAbiertos.has(String(post.id));
    tituloComentarios.textContent=`${comentariosAbiertosAhora?"💬 Ocultar comentarios":"💬 Ver comentarios"} (${totalComentarios})`;
    tituloComentarios.setAttribute("aria-expanded",String(comentariosAbiertosAhora));

    const contenidoComentarios=document.createElement("div");
    contenidoComentarios.className=`comments-content${comentariosAbiertosAhora?"":" hidden"}`;
    tituloComentarios.addEventListener("click",()=>{
      const abierto=!contenidoComentarios.classList.contains("hidden");
      contenidoComentarios.classList.toggle("hidden",abierto);
      tituloComentarios.setAttribute("aria-expanded",String(!abierto));
      if (abierto) comentariosAbiertos.delete(String(post.id));
      else comentariosAbiertos.add(String(post.id));
      tituloComentarios.textContent=`${abierto?"💬 Ver comentarios":"💬 Ocultar comentarios"} (${totalComentarios})`;
      if (!abierto) sonido("click");
    });

    const listaComentarios=document.createElement("div");
    listaComentarios.className="comments-list";
    if (!arbolComentarios.length) {
      const vacio=document.createElement("p");
      vacio.className="comments-empty";
      vacio.textContent="Todavía no hay comentarios. ¡Sé el primero!";
      listaComentarios.append(vacio);
    } else {
      arbolComentarios.forEach(c=>listaComentarios.append(dibujarComentario(c,post.id)));
    }
    contenidoComentarios.append(listaComentarios);
    contenidoComentarios.append(crearFormularioComentario(post.id,null));
    zonaComentarios.append(tituloComentarios,contenidoComentarios);
    articulo.append(zonaComentarios);
    return articulo;
  }

  function dibujarFeed() {
    const feed=$("#feed");
    if (!feed) return;
    feed.replaceChildren();
    if (!datos.posts.length) {
      feed.innerHTML='<div class="empty-state"><div class="empty-emoji">💬</div><strong>El muro está tranquilo...</strong><p>¡Podés empezar la conversación!</p></div>';
      return;
    }
    datos.posts.forEach(p=>feed.append(crearPost(p)));
  }

  function dibujarGrupo() {
    const e=escuelaPorId(datos.grupoId);
    const detalles=$("#groupDetails");
    const feed=$("#groupFeed");
    const boton=$("#changeGroupBtn");
    if (!detalles||!feed||!boton) return;
    detalles.replaceChildren();
    feed.replaceChildren();
    boton.classList.toggle("hidden",!e);

    if (!e) {
      detalles.innerHTML="<h3>👀 Todavía no tenés grupo</h3><p>Elegí tu colegio para participar en su muro.</p>";
      feed.innerHTML='<div class="empty-state"><div class="empty-emoji">🏫</div>Tu comunidad te espera.</div>';
      return;
    }

    const etiqueta=document.createElement("span");
    etiqueta.className="eyebrow";
    etiqueta.textContent="TU GRUPO ACTUAL";
    const titulo=document.createElement("h3");
    titulo.textContent="🏫 "+e.nombre;
    const direccion=document.createElement("p");
    direccion.textContent="📍 "+e.direccion;
    detalles.append(etiqueta,titulo,direccion,crearMapa(e));

    const form=document.createElement("form");
    form.className="group-composer";
    form.innerHTML=`
      <h3>🔒 Mensaje de mi grupo</h3>
      <p>El mensaje aparece en el muro de tu colegio y también en el Feed general.</p>
      <input class="post-title-input" name="titulo" maxlength="90" placeholder="Título del mensaje" required>
      <textarea name="texto" maxlength="1000" placeholder="¿Qué querés contarle a tu grupo?" rows="3" required></textarea>
      <button class="primary-btn" type="submit">Publicar en mi grupo</button>`;

    form.addEventListener("submit",async ev=>{
      ev.preventDefault();
      const titulo=form.elements.titulo.value.trim();
      const texto=form.elements.texto.value.trim();
      if (!titulo||!texto) {
        sonido("error"); avisar("Completá el título y el mensaje."); return;
      }
      const b=form.querySelector("button");
      b.disabled=true;
      try {
        await publicarRemoto({titulo,texto,grupoId:e.id});
        sonido("publicar");
        avisar("¡Mensaje publicado en tu grupo y en el Feed! 🔒");
      } catch (error) {
        console.error(error);
        sonido("error");
        avisar("No se pudo publicar. Revisá la conexión con Supabase.");
      } finally {
        b.disabled=false;
      }
    });
    detalles.append(form);

    const publicaciones=datos.posts.filter(p=>p.grupoId===e.id&&p.tipo==="grupo");
    if (!publicaciones.length) {
      feed.innerHTML='<div class="empty-state"><div class="empty-emoji">💬</div><strong>Todavía no hay publicaciones</strong><p>¡Animate a empezar la conversación!</p></div>';
      return;
    }
    publicaciones.forEach(p=>feed.append(crearPost(p)));
  }

  function dibujarLogros() {
    const cont=$("#achievementList");
    if (!cont) return;
    cont.replaceChildren();
    const estado=estadosLogros();
    actualizarTemaTrueno();
    const desbloqueados=logros.filter(l=>estado[l.id]).length;
    $("#unlockedCount").textContent=desbloqueados;
    $("#totalAchievements").textContent=logros.length;
    $("#achievementProgress").style.width=(desbloqueados/logros.length*100)+"%";

    logros.forEach(l=>{
      const ok=Boolean(estado[l.id]);
      const tarjeta=document.createElement("article");
      tarjeta.className=`achievement-card${ok?" unlocked":""}`;
      const icono=document.createElement("div");
      icono.className="achievement-icon";
      icono.textContent=ok?l.icono:"🔒";
      const texto=document.createElement("div");
      texto.className="achievement-copy";
      const titulo=document.createElement("h3");
      titulo.textContent=l.titulo;
      const desc=document.createElement("p");
      desc.textContent=l.descripcion;
      const premioTexto=document.createElement("p");
      premioTexto.textContent="🎁 Premio: "+l.premio;
      const estadoTexto=document.createElement("span");
      estadoTexto.className="achievement-status";
      estadoTexto.textContent=ok?"✓ DESBLOQUEADO":"🔒 PENDIENTE";
      texto.append(titulo,desc,premioTexto,estadoTexto);
      tarjeta.append(icono,texto);
      cont.append(tarjeta);
    });

    const siguiente=logros.find(l=>!estado[l.id]);
    $("#nextAchievement").textContent=siguiente
      ?`${siguiente.icono} ${siguiente.titulo}: ${siguiente.descripcion}`
      :"¡Desbloqueaste todos los logros disponibles! 🎉";
  }

  function dibujarTodo() {
    dibujarFeed();
    dibujarGrupo();
    dibujarLogros();
    actualizarGrupo();
  }

  // Pantalla inicial
  function iniciarSplash() {
    const splash=$("#splashScreen");
    if (!splash) return;
    setTimeout(()=>{
      splash.classList.add("splash-hidden");
      setTimeout(()=>splash.remove(),650);
    },1750);
  }

  // Contador visual de actividad; es simulado, no representa usuarios reales.
  function iniciarContador() {
    const contador=$("#onlineCount");
    if (!contador) return;
    const opciones=[23,20,30,12,10,24,32,33,11,26,19,17,18,2,5,7,8,15,4,21,13];
    function actualizar() {
      const ahora=new Date();
      const clave=ahora.getFullYear()*1000000+(ahora.getMonth()+1)*10000+ahora.getDate()*100+ahora.getHours();
      contador.textContent=opciones[Math.abs(Math.floor(clave*9301+49297)%opciones.length)];
    }
    actualizar();
    setInterval(actualizar,30000);
  }

  function reproducirTruenoUnaVez(id) {
    const clave=String(id);
    if (publicacionesTruenoEscuchadas.has(clave)) return;
    publicacionesTruenoEscuchadas.add(clave);
    sonido("trueno");
  }

  function escucharPublicacionesTrueno() {
    if (!db || typeof db.channel!=="function") return;
    try {
      db.channel("indiscretos-poder-del-trueno")
        .on("postgres_changes",{event:"INSERT",schema:"public",table:"posts"},payload=>{
          const post=payload?.new;
          if (!post || !post.id || (usuario && post.user_id===usuario.id)) return;
          let contenido={};
          try { contenido=JSON.parse(post.content||"{}"); } catch (_) {}
          if (contenido.poderTrueno) reproducirTruenoUnaVez(post.id);
        })
        .subscribe();
    } catch(error) {
      console.warn("El sonido de trueno usará la actualización periódica como alternativa.",error);
    }
  }

  // Arranque
  async function iniciar() {
    cargarLocal();
    // Si el colegio guardado ya no existe en la lista, limpiar la selección vieja.
    if (datos.grupoId && !escuelaPorId(datos.grupoId)) {
      datos.grupoId=null;
      guardarLocal();
    }
    iniciarSplash();
    localStorage.setItem("indiscretos_feed_visitado","1");
    dibujarEscuelas();
    dibujarGrupo();
    dibujarLogros();
    actualizarGrupo();
    iniciarContador();

    try {
      await conectar();
      await cargarRemoto(true);
      escucharPublicacionesTrueno();
      // No redibujar el muro mientras alguien está escribiendo un comentario o respuesta:
      // el refresco reemplaza el DOM y podría borrar el borrador.
      setInterval(()=>{
        // Evita peticiones y repintados si la pestaña no se ve o alguien está escribiendo.
        if (document.hidden) return;
        const camposEditables = [...document.querySelectorAll(".comment-form textarea, #postText, #postTitle, .group-composer textarea, .group-composer input")];
        const editando = camposEditables.some(campo =>
          campo === document.activeElement || campo.value.length > 0
        );
        if (!editando) cargarRemoto(false);
      },30000);
    } catch (error) {
      console.error(error);
      avisar("No se pudo conectar a Supabase. Revisá la configuración.");
    }
  }

  if (document.readyState==="loading") {
    document.addEventListener("DOMContentLoaded",iniciar,{once:true});
  } else {
    iniciar();
  }
})();