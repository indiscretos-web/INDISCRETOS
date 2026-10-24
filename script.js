// INDISCRETOS — versión conectada a Supabase
(() => {
  "use strict";

  const $ = s => document.querySelector(s);
  const STORAGE_KEY = "indiscretos_v2_data";
  const SUPABASE_URL = "https://akrwawkfazuopkxxitzs.supabase.co";
  const SUPABASE_KEY = "sb_publishable_q3E2D87zvkwBiLVygIwdtA_RpK3q1Fd";

  let db = null;
  let usuario = null;
  let conexionEnCurso = null;
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
    // Compartir una sola conexión si varias partes de la página arrancan a la vez.
    if (usuario && db) return;
    if (conexionEnCurso) return conexionEnCurso;

    conexionEnCurso = (async () => {
      if (!window.supabase?.createClient) {
        await new Promise((resolve,reject)=>{
          const s=document.createElement("script");
          s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
          s.onload=resolve;
          s.onerror=()=>reject(new Error("No se pudo cargar Supabase."));
          document.head.appendChild(s);
        });
      }

      // Reutilizar el cliente de Indiscretos en vez de crear instancias concurrentes.
      db = window.__indiscretosSupabaseClient ||
        window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
          auth:{
            persistSession:true,
            autoRefreshToken:true,
            detectSessionInUrl:false,
            storageKey:"sb-akrwawkfazuopkxxitzs-auth-token"
          }
        });
      window.__indiscretosSupabaseClient = db;

      const sesion = await db.auth.getSession();
      if (sesion.error) throw sesion.error;

      if (sesion.data.session) {
        usuario = sesion.data.session.user;
      } else {
        const resultado = await db.auth.signInAnonymously();
        if (resultado.error) throw resultado.error;
        usuario = resultado.data.user;
      }
      if (!usuario?.id) throw new Error("Supabase no devolvió un usuario válido.");
    })();

    try {
      await conexionEnCurso;
    } finally {
      conexionEnCurso = null;
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

      // Buscar los alias configurados para autores de publicaciones, comentarios y respuestas.
      const idsAutores = [...new Set([
        ...remotos.map(p=>p.user_id),
        ...comentarios.map(c=>c.user_id)
      ].filter(Boolean))];
      const aliasPorUsuario = Object.create(null);
      if (idsAutores.length) {
        try {
          const perfiles = await db.from("chat_profiles").select("user_id,alias").in("user_id", idsAutores);
          if (perfiles.error) throw perfiles.error;
          (perfiles.data || []).forEach(perfil => { aliasPorUsuario[perfil.user_id] = perfil.alias; });
        } catch (errorAlias) {
          console.warn("No se pudieron cargar los alias; se mostrarán autores anónimos.", errorAlias);
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
          autorAlias:aliasPorUsuario[p.user_id] || null,
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
              autorAlias:aliasPorUsuario[c.user_id] || null,
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
      // Consultar el total real antes de insertar para no depender de un contador visual desactualizado.
      const conteo = await db.from("post_likes")
        .select("*",{count:"exact",head:true})
        .eq("post_id",post.id);
      if (conteo.error) throw conteo.error;
      if ((conteo.count ?? Number(post.likes)) >= 40) {
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
    if (vista==="mensajes") iniciarMensajesPrivados();
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
    autor.className="comment-author";
    autor.textContent=comentario.autorAlias ? "@"+comentario.autorAlias : "🎭 Anónimo";
    const insigniaComentario=etiquetasDeAutor(comentario.user_id)[0];
    if (insigniaComentario) {
      const insignia=document.createElement("span");
      insignia.className="author-achievement-tag "+insigniaComentario.clase;
      insignia.textContent=insigniaComentario.texto;
      insignia.title="Logro actual";
      autor.append(" ",insignia);
    }
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

    // Solo se muestra la insignia de mayor nivel desbloqueada; al avanzar, reemplaza la anterior.
    if (publicaciones.length >= 10 && totalLikes >= 20) return [{texto:"⚡ PODER DEL TRUENO",clase:"tag-trueno"}];
    if (publicaciones.length >= 10) return [{texto:"ABSOLUTE",clase:"tag-absolute"}];
    if (totalLikes >= 10) return [{texto:"CLASE A",clase:"tag-clase-a"}];
    if (publicaciones.length >= 5) return [{texto:"CLASE B",clase:"tag-clase-b"}];
    if (comentarios >= 5) return [{texto:"CLASE C",clase:"tag-clase-c"}];
    if (publicaciones.some(p=>Number(p.likes)>=5)) return [{texto:"PREMIUM",clase:"tag-premium"}];
    if (publicaciones.length >= 3) return [{texto:"ÉLITE",clase:"tag-elite"}];
    if (comentarios >= 1) return [{texto:"RECLUTA",clase:"tag-recluta"}];
    if (publicaciones.length >= 1) return [{texto:"APRENDIZ",clase:"tag-aprendiz"}];
    return [];
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
    autor.textContent=post.autorAlias ? "Publicado por @"+post.autorAlias : "Publicado por Anónimo";
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


  // Mensajería privada: los mensajes se sincronizan por Supabase y el historial visible se conserva localmente.
  let chatAliasActual = "";
  let chatActivoId = "";
  let chatRefreshTimer = null;
  const CHAT_TTL_MS = 60 * 60 * 1000;
  const chatsGuardados = [];
  const mensajesSinLeerPorChat = Object.create(null);
  let chatInboxTimer = null;
  const chatLocalKey = () => "indiscretos_chats_v1_" + (usuario?.id || "sin-cuenta");
  const chatReadKey = id => "indiscretos_chat_leido_v1_" + (usuario?.id || "sin-cuenta") + "_" + id;
  function ultimaLecturaChat(id) {
    try { return Number(localStorage.getItem(chatReadKey(id))) || 0; } catch (_) { return 0; }
  }
  function marcarChatLeido(id, fecha = Date.now()) {
    if (!id) return;
    const marca = typeof fecha === "number" ? fecha : Date.parse(fecha);
    if (Number.isFinite(marca) && marca > ultimaLecturaChat(id)) {
      try { localStorage.setItem(chatReadKey(id), String(marca)); } catch (_) {}
    }
    delete mensajesSinLeerPorChat[id];
    actualizarContadorMensajes();
  }
  function actualizarContadorMensajes() {
    const badge = $("#messagesNavBadge");
    if (!badge) return;
    const total = Object.values(mensajesSinLeerPorChat).reduce((s,n) => s + (Number(n) || 0), 0);
    badge.textContent = total > 99 ? "99+" : String(total);
    badge.classList.toggle("hidden", total < 1);
    badge.setAttribute("aria-label", total + (total === 1 ? " mensaje sin leer" : " mensajes sin leer"));
  }
  const mensajesLocalKey = id => "indiscretos_mensajes_v1_" + (usuario?.id || "sin-cuenta") + "_" + id;

  function leerChatsGuardados() {
    try {
      const lista = JSON.parse(localStorage.getItem(chatLocalKey()) || "[]");
      chatsGuardados.splice(0, chatsGuardados.length, ...(Array.isArray(lista) ? lista : []));
    } catch (_) { chatsGuardados.splice(0, chatsGuardados.length); }
  }
  function guardarChatsGuardados() {
    try { localStorage.setItem(chatLocalKey(), JSON.stringify(chatsGuardados)); }
    catch (_) { avisar("No se pudieron guardar los chats en este navegador."); }
  }
  function limpiarMensajesVencidos(chatId) {
    // No borrar el historial: debe aparecer también en otros dispositivos.
    // Se conserva la función para compatibilidad con las llamadas existentes.
  }
  function leerMensajesLocales(chatId) {
    limpiarMensajesVencidos(chatId);
    try { return JSON.parse(localStorage.getItem(mensajesLocalKey(chatId)) || "[]"); } catch (_) { return []; }
  }
  function guardarMensajesLocales(chatId, lista) {
    // Guardar el historial completo; no ocultar mensajes por antigüedad.
    try { localStorage.setItem(mensajesLocalKey(chatId), JSON.stringify(lista)); } catch (_) {}
  }
  function buscarChatGuardado(userId) {
    return chatsGuardados.find(c => c.userId === userId);
  }
  function mostrarAliasSetup(mostrar) {
    $("#chatAliasSetup")?.classList.toggle("hidden", !mostrar);
    $("#chatWorkspace")?.classList.toggle("hidden", mostrar);
  }
  function dibujarChatsGuardados() {
    const cont = $("#savedChatList");
    if (!cont) return;
    cont.replaceChildren();
    if (!chatsGuardados.length) {
      cont.innerHTML = '<p class="tiny-note">Todavía no guardaste ningún chat. Buscá un alias para empezar.</p>';
      return;
    }
    chatsGuardados.forEach(chat => {
      const fila = document.createElement("button");
      fila.type = "button";
      fila.className = "saved-chat-row" + (chatActivoId === chat.userId ? " active" : "");
      const info = document.createElement("span");
      info.className = "saved-chat-info";
      const nombre = document.createElement("span");
      nombre.className = "saved-chat-name";
      nombre.textContent = chat.title || chat.alias;
      const alias = document.createElement("small");
      alias.textContent = "@" + chat.alias;
      info.append(nombre, alias);
      fila.append(info);
      const sinLeer = Number(mensajesSinLeerPorChat[chat.userId]) || 0;
      if (sinLeer > 0) {
        const burbuja = document.createElement("span");
        burbuja.className = "chat-unread-badge";
        burbuja.textContent = sinLeer > 99 ? "99+" : String(sinLeer);
        burbuja.setAttribute("aria-label", sinLeer + (sinLeer === 1 ? " mensaje sin leer" : " mensajes sin leer"));
        fila.append(burbuja);
      }
      fila.addEventListener("click", () => abrirChatGuardado(chat.userId));
      cont.append(fila);
    });
  }
  async function sincronizarChatsEntrantes() {
    if (!usuario || !db) return;
    try {
      const recibidos = await db.from("direct_messages")
        .select("sender_id,recipient_id,created_at")
        .or("sender_id.eq." + usuario.id + ",recipient_id.eq." + usuario.id)
        .order("created_at", {ascending:false})
        .limit(1000);
      if (recibidos.error) throw recibidos.error;

      const mensajes = recibidos.data || [];
      const estadoSync = $("#chatSyncStatus");
      if (estadoSync && usuario?.is_anonymous === false) {
        const recibidosAhora = mensajes.filter(m => m.recipient_id === usuario.id && m.sender_id !== usuario.id).length;
        estadoSync.textContent = "Cuenta @" + (chatAliasActual || "activa") + " · " + mensajes.length + " mensajes recientes detectados (" + recibidosAhora + " recibidos).";
        estadoSync.classList.remove("hidden");
      }
      Object.keys(mensajesSinLeerPorChat).forEach(id => delete mensajesSinLeerPorChat[id]);
      mensajes.forEach(m => {
        if (m.recipient_id !== usuario.id || !m.sender_id || m.sender_id === usuario.id) return;
        const salaAbierta = m.sender_id === chatActivoId &&
          $("#view-mensajes") && !$("#view-mensajes").classList.contains("hidden") &&
          $("#chatRoom") && !$("#chatRoom").classList.contains("hidden") &&
          !document.hidden;
        if (salaAbierta) return;
        if (Date.parse(m.created_at) > ultimaLecturaChat(m.sender_id)) {
          mensajesSinLeerPorChat[m.sender_id] = (mensajesSinLeerPorChat[m.sender_id] || 0) + 1;
        }
      });
      actualizarContadorMensajes();
      dibujarChatsGuardados();

      const otrosIds = [...new Set(mensajes.map(m =>
        m.sender_id === usuario.id ? m.recipient_id : m.sender_id
      ).filter(Boolean).filter(id => id !== usuario.id))];
      if (!otrosIds.length) return;

      const perfiles = await db.from("chat_profiles").select("user_id,alias").in("user_id", otrosIds);
      if (perfiles.error) throw perfiles.error;
      let cambio = false;
      (perfiles.data || []).forEach(perfil => {
        let chat = buscarChatGuardado(perfil.user_id);
        if (!chat) {
          chat = { userId: perfil.user_id, alias: perfil.alias, title: perfil.alias };
          chatsGuardados.unshift(chat);
          cambio = true;
        } else if (chat.alias !== perfil.alias) {
          const aliasAnterior = chat.alias;
          chat.alias = perfil.alias;
          if (!chat.title || chat.title === aliasAnterior) chat.title = perfil.alias;
          cambio = true;
        }
      });
      if (cambio) {
        guardarChatsGuardados();
        dibujarChatsGuardados();
      }
    } catch (error) {
      console.warn("No se pudieron revisar los mensajes recibidos:", error);
      const estado = $("#chatSyncStatus");
      if (estado && usuario?.is_anonymous === false) {
        const detalle = [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(" — ");
        estado.textContent = "Error al sincronizar @" + (chatAliasActual || "tu cuenta") + ": " + (detalle || "error de conexión con Supabase");
        estado.classList.remove("hidden");
      }
    }
  }

  function dibujarResultadosAlias(perfiles) {
    const cont = $("#chatSearchResults");
    if (!cont) return;
    cont.replaceChildren();
    if (!perfiles.length) {
      cont.innerHTML = '<p class="tiny-note">No encontramos ese alias.</p>';
      return;
    }
    perfiles.forEach(perfil => {
      const fila = document.createElement("div");
      fila.className = "chat-result-row";
      const etiqueta = document.createElement("span");
      etiqueta.textContent = "@" + perfil.alias;
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "secondary-btn";
      boton.textContent = buscarChatGuardado(perfil.user_id) ? "Abrir chat" : "Escribir";
      boton.addEventListener("click", () => {
        let chat = buscarChatGuardado(perfil.user_id);
        if (!chat) {
          chat = { userId: perfil.user_id, alias: perfil.alias, title: perfil.alias };
          chatsGuardados.push(chat);
          guardarChatsGuardados();
        } else {
          chat.alias = perfil.alias;
        }
        abrirChatGuardado(perfil.user_id);
      });
      fila.append(etiqueta, boton);
      cont.append(fila);
    });
  }
  // Sincroniza la bandeja y, si hay una conversación abierta en pantalla, vuelve a cargarla.
  // Esto mantiene la vista de la PC actualizada aunque el chat se haya abierto antes de recibir mensajes.
  async function refrescarBandejaCompleta() {
    if (document.hidden || !usuario || !db) return;
    await sincronizarChatsEntrantes();
    const mensajesVisible = $("#view-mensajes") && !$("#view-mensajes").classList.contains("hidden");
    const salaVisible = $("#chatRoom") && !$("#chatRoom").classList.contains("hidden");
    if (chatActivoId && mensajesVisible && salaVisible && !$("#chatMessageInput")?.value) {
      await actualizarMensajesChat();
    }
  }

  // Actualizar el contador al volver a la ventana o pestaña en escritorio.
  let ultimaRefrescadaBandeja = 0;
  async function refrescarContadorAlVolver() {
    if (document.hidden || !usuario || !db) return;
    const ahora = Date.now();
    if (ahora - ultimaRefrescadaBandeja < 1500) return;
    ultimaRefrescadaBandeja = ahora;
    await sincronizarChatsEntrantes();
  }
  window.addEventListener("focus", refrescarContadorAlVolver);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refrescarContadorAlVolver();
  });

  async function iniciarMensajesPrivados() {
    try {
      await conectar();
      // La sesión de Auth es la fuente de verdad al volver a la sección.
      // No confiar únicamente en la variable usuario, que puede quedar desactualizada.
      const sesionActual = await db.auth.getSession();
      if (sesionActual.error) throw sesionActual.error;
      usuario = sesionActual.data?.session?.user || usuario;
      if (!usuario?.id) throw new Error("No se pudo recuperar la sesión. Volvé a iniciar sesión.");
      const r = await db.from("chat_profiles").select("user_id,alias").eq("user_id", usuario.id).maybeSingle();
      if (r.error) throw r.error;
      leerChatsGuardados();
      const panel = $("#chatAccountPanel");
      const permanente = usuario && usuario.is_anonymous === false;
      if (r.data) {
        chatAliasActual = r.data.alias;
        $("#chatOwnAlias").textContent = chatAliasActual;
        if ($("#chatAccountAlias")) $("#chatAccountAlias").value = chatAliasActual;
      }
      // Primero se crea/vincula una cuenta o se inicia sesión. No generar alias ni abrir chats
      // automáticamente para visitantes anónimos.
      if (permanente && r.data) {
        panel?.classList.add("hidden");
        mostrarAliasSetup(false);
        $("#chatWorkspace")?.classList.remove("hidden");
        await sincronizarChatsEntrantes();
        dibujarChatsGuardados();
        if (chatInboxTimer) clearInterval(chatInboxTimer);
        chatInboxTimer = setInterval(() => {
          if (!document.hidden) refrescarBandejaCompleta();
        }, 5000);
      } else {
        panel?.classList.remove("hidden");
        $("#chatWorkspace")?.classList.add("hidden");
        $("#chatAliasSetup")?.classList.add("hidden");
        if (chatInboxTimer) clearInterval(chatInboxTimer);
      }
    } catch (error) {
      console.error("Mensajes privados:", error);
      if ($("#chatAccountStatus")) $("#chatAccountStatus").textContent =
        "No se pudo preparar el acceso: " + (error?.message || "revisá la configuración de Supabase.");
    }
  }
  // Cuentas multiplataforma: alias como identificador y correo sintético reservado.
  // Requiere desactivar la confirmación de email en Supabase porque no se pide un email real.
  const correoDeAlias = alias => normalizar(alias) + "@indiscretos.invalid";

  function validarAliasCuenta(alias) {
    return /^[A-Za-z0-9_]{3,8}$/.test(alias);
  }

  async function refrescarChatTrasLogin(perfil) {
    const verificacion = await db.auth.getUser();
    if (verificacion.error) throw verificacion.error;
    usuario = verificacion.data.user;
    if (!usuario?.id) throw new Error("Supabase no devolvió una identidad válida.");
    chatAliasActual = perfil.alias;
    $("#chatOwnAlias").textContent = chatAliasActual;
    $("#chatAccountAlias").value = chatAliasActual;
    actualizarBotonCambiarAlias();
    $("#chatAccountPassword").value = "";
    $("#chatAccountStatus").textContent = "Sesión iniciada como @" + chatAliasActual + ". Tus mensajes se sincronizan con esta cuenta.";
    $("#chatAccountPanel")?.classList.add("hidden");
    mostrarAliasSetup(false);
    $("#chatWorkspace").classList.remove("hidden");
    leerChatsGuardados();
    dibujarChatsGuardados();
    await sincronizarChatsEntrantes();
    if (chatInboxTimer) clearInterval(chatInboxTimer);
    chatInboxTimer = setInterval(() => {
      if (!document.hidden) refrescarBandejaCompleta();
    }, 5000);
  }

  $("#chatAccountLinkBtn")?.addEventListener("click", async () => {
    const alias = $("#chatAccountAlias").value.trim();
    const password = $("#chatAccountPassword").value;
    const status = $("#chatAccountStatus");
    const boton = $("#chatAccountLinkBtn");
    if (!validarAliasCuenta(alias)) {
      status.textContent = "El alias debe tener entre 3 y 8 caracteres: letras, números o guion bajo.";
      return;
    }
    if (password.length < 8 || password.length > 72) {
      status.textContent = "La contraseña debe tener entre 8 y 72 caracteres.";
      return;
    }
    boton.disabled = true;
    try {
      await conectar();
      const verificada = await db.auth.getUser();
      if (verificada.error) throw verificada.error;
      const user = verificada.data.user;
      if (!user?.id) throw new Error("No hay una sesión válida. Recargá la página e intentá de nuevo.");

      const perfilActual = await db.from("chat_profiles")
        .select("user_id,alias").eq("user_id", user.id).maybeSingle();
      if (perfilActual.error) throw perfilActual.error;
      const aliasOcupado = await db.from("chat_profiles")
        .select("user_id,alias").ilike("alias", alias).maybeSingle();
      if (aliasOcupado.error) throw aliasOcupado.error;
      if (aliasOcupado.data && aliasOcupado.data.user_id !== user.id) {
        throw new Error("Ese alias ya pertenece a otra cuenta. Elegí tu alias actual.");
      }

      let perfil = perfilActual.data;
      if (perfil && perfil.alias.toLowerCase() !== alias.toLowerCase()) {
        throw new Error("Para conservar tus mensajes, escribí exactamente tu alias actual: @" + perfil.alias + ".");
      }
      if (!perfil) {
        const alta = await db.from("chat_profiles")
          .insert({user_id:user.id, alias})
          .select("user_id,alias").single();
        if (alta.error) throw alta.error;
        perfil = alta.data;
      }

      const vinculacion = await db.auth.updateUser({
        email: correoDeAlias(perfil.alias),
        password
      });
      if (vinculacion.error) throw vinculacion.error;
      usuario = vinculacion.data.user || user;
      chatAliasActual = perfil.alias;
      $("#chatOwnAlias").textContent = chatAliasActual;
      $("#chatAccountAlias").value = chatAliasActual;
      $("#chatAccountPassword").value = "";
      status.textContent = "¡Listo! @" + chatAliasActual + " ya tiene contraseña. Usá ese alias y esa contraseña en el otro dispositivo.";
      await refrescarChatTrasLogin(perfil);
      $("#chatAccountPanel")?.classList.add("hidden");
      avisar("Cuenta vinculada. Tus mensajes conservan la misma identidad.");
    } catch (error) {
      console.error("No se pudo vincular la cuenta:", error);
      status.textContent = error?.message || "No se pudo crear la cuenta. Revisá la configuración de Email en Supabase.";
    } finally {
      boton.disabled = false;
    }
  });

  $("#chatAccountForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    const alias = $("#chatAccountAlias").value.trim();
    const password = $("#chatAccountPassword").value;
    const status = $("#chatAccountStatus");
    const boton = $("#chatAccountLoginBtn");
    if (!validarAliasCuenta(alias)) {
      status.textContent = "El alias debe tener entre 3 y 8 caracteres: letras, números o guion bajo.";
      return;
    }
    if (password.length < 8 || password.length > 72) {
      status.textContent = "La contraseña debe tener entre 8 y 72 caracteres.";
      return;
    }
    boton.disabled = true;
    try {
      await conectar();
      const ingreso = await db.auth.signInWithPassword({
        email: correoDeAlias(alias),
        password
      });
      if (ingreso.error) {
        console.error("Supabase rechazó el inicio de sesión:", ingreso.error);
        const mensaje = ingreso.error.message || "";
        if (/email not confirmed/i.test(mensaje)) throw new Error("La cuenta existe, pero Supabase todavía no confirmó el email interno. En Auth → Providers → Email, desactivá Confirm email y volvé a vincular la cuenta desde el dispositivo donde la creaste.");
        if (/invalid login credentials/i.test(mensaje)) throw new Error("Supabase no encuentra una cuenta válida con ese alias y contraseña. Puede que solo se haya creado el perfil en chat_profiles y no la cuenta de acceso. Volvé al dispositivo donde la creaste y tocá Crear / vincular contraseña; después probá otra vez.");
        throw new Error("Supabase: " + mensaje);
      }
      usuario = ingreso.data.user;

      const resultadoPerfil = await db.from("chat_profiles")
        .select("user_id,alias").eq("user_id", usuario.id).maybeSingle();
      if (resultadoPerfil.error) throw resultadoPerfil.error;
      let perfil = resultadoPerfil.data;
      if (!perfil) {
        const alta = await db.from("chat_profiles")
          .insert({user_id:usuario.id, alias})
          .select("user_id,alias").single();
        if (alta.error) throw alta.error;
        perfil = alta.data;
      }
      await refrescarChatTrasLogin(perfil);
      avisar("Sesión iniciada. Ya estás conectado a tu cuenta.");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      status.textContent = error?.message || "No se pudo iniciar sesión.";
    } finally {
      boton.disabled = false;
    }
  });

  $("#chatAliasForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    const aliasNuevo = $("#chatAliasInput").value.trim();
    const status = $("#chatAliasStatus");
    const boton = $("#chatAliasForm button[type=submit]");
    if (!validarAliasCuenta(aliasNuevo)) {
      status.textContent = "Usá entre 3 y 8 caracteres: letras, números o guion bajo.";
      return;
    }
    if (usuario?.is_anonymous !== false) {
      status.textContent = "Iniciá sesión con tu cuenta para cambiar el alias.";
      return;
    }
    const restante = aliasDisponibleDesde() - Date.now();
    if (restante > 0) {
      const minutos = Math.ceil(restante / 60000);
      status.textContent = "Por seguridad, solo podés cambiarlo cada 3 horas. Esperá " + Math.floor(minutos / 60) + " h " + (minutos % 60) + " min.";
      return;
    }
    if (aliasNuevo.toLowerCase() === String(chatAliasActual).toLowerCase()) {
      mostrarAliasSetup(false);
      return;
    }
    boton.disabled = true;
    try {
      await conectar();
      const ocupado = await db.from("chat_profiles").select("user_id,alias").ilike("alias",aliasNuevo).maybeSingle();
      if (ocupado.error) throw ocupado.error;
      if (ocupado.data && ocupado.data.user_id !== usuario.id) throw new Error("Ese alias ya está ocupado. Elegí otro.");
      const cambioAuth = await db.auth.updateUser({
        email:correoDeAlias(aliasNuevo),
        data:{...(usuario.user_metadata || {}), alias:aliasNuevo, alias_changed_at:Date.now()}
      });
      if (cambioAuth.error) throw cambioAuth.error;
      const cambioPerfil = await db.from("chat_profiles").update({alias:aliasNuevo}).eq("user_id",usuario.id);
      if (cambioPerfil.error) {
        status.textContent = "Se actualizó la cuenta, pero no el perfil del alias. No cierres sesión; contactá al administrador.";
        throw cambioPerfil.error;
      }
      usuario = cambioAuth.data.user || usuario;
      chatAliasActual = aliasNuevo;
      $("#chatOwnAlias").textContent = aliasNuevo;
      $("#chatAccountAlias").value = aliasNuevo;
      $("#chatAccountStatus").textContent = "Tu cuenta es @" + aliasNuevo + ".";
      mostrarAliasSetup(false);
      leerChatsGuardados();
      dibujarChatsGuardados();
      actualizarBotonCambiarAlias();
      avisar("Alias actualizado. Podrás cambiarlo de nuevo en 3 horas.");
    } catch (error) {
      console.error("Error al cambiar alias:",error);
      status.textContent = error?.message || "No se pudo cambiar el alias.";
    } finally {
      boton.disabled = false;
    }
  });
    const TRES_HORAS_MS = 3 * 60 * 60 * 1000;
  const aliasDisponibleDesde = () => Number(usuario?.user_metadata?.alias_changed_at || 0) + TRES_HORAS_MS;
  function actualizarBotonCambiarAlias() {
    const boton = $("#chatChangeAlias");
    if (!boton) return;
    const restante = aliasDisponibleDesde() - Date.now();
    boton.disabled = restante > 0;
    if (restante > 0) {
      const minutos = Math.ceil(restante / 60000);
      boton.title = "Podés cambiarlo de nuevo en aproximadamente " + Math.floor(minutos / 60) + " h " + (minutos % 60) + " min.";
    } else {
      boton.title = "Podés cambiar tu alias.";
    }
  }
  document.querySelectorAll("[data-toggle-password]").forEach(boton => {
    boton.addEventListener("click", () => {
      const campo = $("#" + boton.dataset.togglePassword);
      if (!campo) return;
      const visible = campo.type === "password";
      campo.type = visible ? "text" : "password";
      boton.textContent = visible ? "Ocultar" : "Ver";
      boton.setAttribute("aria-pressed", String(visible));
    });
  });
  $("#chatChangeAlias")?.addEventListener("click", async () => {
    if (!usuario || usuario.is_anonymous !== false) {
      avisar("Primero iniciá sesión con tu cuenta.");
      return;
    }
    const restante = aliasDisponibleDesde() - Date.now();
    if (restante > 0) {
      const minutos = Math.ceil(restante / 60000);
      avisar("Podés cambiar tu alias en " + Math.floor(minutos / 60) + " h " + (minutos % 60) + " min.");
      actualizarBotonCambiarAlias();
      return;
    }
    $("#chatAliasInput").value = chatAliasActual;
    mostrarAliasSetup(true);
    $("#chatAliasStatus").textContent = "El cambio de alias estará disponible una vez cada 3 horas.";
  });
  $("#chatTogglePasswordPanel")?.addEventListener("click", () => {
    $("#chatPasswordPanel")?.classList.toggle("hidden");
    if (!$("#chatPasswordPanel")?.classList.contains("hidden")) $("#chatCurrentPassword")?.focus();
  });
  $("#chatPasswordForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    const actual = $("#chatCurrentPassword").value;
    const nueva = $("#chatNewPassword").value;
    const confirmar = $("#chatNewPasswordConfirm").value;
    const status = $("#chatPasswordStatus");
    const boton = $("#chatPasswordSaveBtn");
    if (nueva.length < 8 || nueva.length > 72) {
      status.textContent = "La nueva contraseña debe tener entre 8 y 72 caracteres.";
      return;
    }
    if (nueva !== confirmar) {
      status.textContent = "Las nuevas contraseñas no coinciden.";
      return;
    }
    if (actual === nueva) {
      status.textContent = "La nueva contraseña debe ser distinta de la actual.";
      return;
    }
    boton.disabled = true;
    status.textContent = "Verificando la contraseña actual…";
    try {
      await conectar();
      const emailActual = usuario?.email || correoDeAlias(chatAliasActual);
      const verificacion = await db.auth.signInWithPassword({email:emailActual,password:actual});
      if (verificacion.error) throw new Error("La contraseña actual no es correcta.");
      const cambio = await db.auth.updateUser({password:nueva});
      if (cambio.error) throw cambio.error;
      usuario = cambio.data.user || usuario;
      $("#chatCurrentPassword").value = "";
      $("#chatNewPassword").value = "";
      $("#chatNewPasswordConfirm").value = "";
      document.querySelectorAll("#chatPasswordForm [data-toggle-password]").forEach(b => {
        const campo = $("#" + b.dataset.togglePassword);
        if (campo) campo.type = "password";
        b.textContent = "Ver";
        b.setAttribute("aria-pressed","false");
      });
      status.textContent = "Contraseña actualizada correctamente.";
    } catch (error) {
      console.error("No se pudo cambiar la contraseña:",error);
      status.textContent = error?.message || "No se pudo cambiar la contraseña.";
    } finally {
      boton.disabled = false;
    }
  });
  $("#chatSearchForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    const q = $("#chatSearchInput").value.trim();
    const cont = $("#chatSearchResults");
    if (q.length < 2) {
      cont.innerHTML = '<p class="tiny-note">Escribí al menos dos caracteres.</p>';
      return;
    }
    try {
      await conectar();
      const r = await db.from("chat_profiles").select("user_id,alias")
        .ilike("alias", "%" + q.replace(/[%_]/g, "\\  function dibujarTodo() {") + "%")
        .neq("user_id", usuario.id).order("alias").limit(20);
      if (r.error) throw r.error;
      dibujarResultadosAlias(r.data || []);
    } catch (error) {
      console.error(error);
      cont.innerHTML = '<p class="tiny-note">No se pudo buscar. Revisá la configuración de Supabase.</p>';
    }
  });
  async function abrirChatGuardado(userId) {
    const chat = buscarChatGuardado(userId);
    if (!chat) return;
    chatActivoId = userId;
    marcarChatLeido(userId, Date.now());
    $("#chatRoom").classList.remove("hidden");
    $("#chatRoomTitle").textContent = chat.title || chat.alias;
    $("#chatRoomAlias").textContent = "Conversación con @" + chat.alias;
    dibujarChatsGuardados();
    await actualizarMensajesChat();
    if (chatRefreshTimer) clearInterval(chatRefreshTimer);
    chatRefreshTimer = setInterval(() => {
      const mensajesVisible = $("#view-mensajes") && !$("#view-mensajes").classList.contains("hidden");
      const salaVisible = $("#chatRoom") && !$("#chatRoom").classList.contains("hidden");
      if (chatActivoId === userId && mensajesVisible && salaVisible && !document.hidden && !$("#chatMessageInput").value) actualizarMensajesChat();
    }, 10000);
  }
  async function actualizarMensajesChat() {
    const chat = buscarChatGuardado(chatActivoId);
    if (!chat || !usuario) return;
    const cont = $("#chatMessages");
    try {
      const local = leerMensajesLocales(chat.userId);
      const r = await db.from("direct_messages").select("id,sender_id,recipient_id,content,created_at")
        .or("and(sender_id.eq." + usuario.id + ",recipient_id.eq." + chat.userId + "),and(sender_id.eq." + chat.userId + ",recipient_id.eq." + usuario.id + ")")
        .order("created_at", {ascending:true}).limit(1000);
      if (r.error) throw r.error;
      const unicos = new Map();
      [...local, ...(r.data || [])].forEach(m => unicos.set(m.id, m));
      const mensajes = [...unicos.values()].sort((a,b) => Date.parse(a.created_at)-Date.parse(b.created_at));
      guardarMensajesLocales(chat.userId, mensajes);
      const ultimoRecibido = mensajes
        .filter(m => m.sender_id === chat.userId && m.recipient_id === usuario.id)
        .reduce((ultimo, m) => Math.max(ultimo, Date.parse(m.created_at) || 0), 0);
      // Solo marcar como leído si la conversación realmente está a la vista.
      const mensajesVisible = $("#view-mensajes") && !$("#view-mensajes").classList.contains("hidden");
      const salaVisible = $("#chatRoom") && !$("#chatRoom").classList.contains("hidden");
      if (ultimoRecibido > 0 && mensajesVisible && salaVisible && !document.hidden) {
        marcarChatLeido(chat.userId, ultimoRecibido);
      }
      cont.replaceChildren();
      if (!mensajes.length) {
        cont.innerHTML = '<p class="tiny-note">Todavía no hay mensajes. ¡Mandá el primero!</p>';
      } else {
        mensajes.forEach(m => {
          const burbuja = document.createElement("div");
          burbuja.className = "private-message" + (m.sender_id === usuario.id ? " mine" : "");
          const texto = document.createElement("p");
          texto.textContent = m.content;
          const hora = document.createElement("small");
          hora.textContent = new Date(m.created_at).toLocaleTimeString("es-AR", {hour:"2-digit", minute:"2-digit"});
          burbuja.append(texto, hora);
          cont.append(burbuja);
        });
        cont.scrollTop = cont.scrollHeight;
      }
    } catch (error) {
      console.error("Mensajes:", error);
      const detalle = [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(" — ");
      cont.textContent = "No se pudieron cargar los mensajes: " + (detalle || "error de conexión con Supabase");
    }
  }
  $("#chatSendForm")?.addEventListener("submit", async ev => {
    ev.preventDefault();
    const texto = $("#chatMessageInput").value.trim();
    const chat = buscarChatGuardado(chatActivoId);
    if (!chat || !texto) return;
    const boton = $("#chatSendForm button[type=submit]");
    boton.disabled = true;
    try {
      await conectar();

      // Validar la identidad contra Auth, no confiar solo en la sesión guardada localmente.
      // La política RLS exige que sender_id sea exactamente auth.uid().
      let sesionActual = await db.auth.getSession();
      if (sesionActual.error) throw sesionActual.error;

      if (!sesionActual.data?.session?.access_token) {
        const nuevaSesion = await db.auth.signInAnonymously();
        if (nuevaSesion.error) throw nuevaSesion.error;
        sesionActual = await db.auth.getSession();
        if (sesionActual.error) throw sesionActual.error;
      }

      // getUser valida el token contra el servidor de Supabase.
      let identidadVerificada = await db.auth.getUser();
      if (identidadVerificada.error) {
        const refresco = await db.auth.refreshSession();
        if (refresco.error) throw identidadVerificada.error;
        identidadVerificada = await db.auth.getUser();
        if (identidadVerificada.error) throw identidadVerificada.error;
      }

      const remitente = identidadVerificada.data?.user;
      const idSesion = sesionActual.data?.session?.user?.id;
      if (!remitente?.id) {
        throw new Error("Supabase no pudo validar tu sesión. Recargá la página e intentá de nuevo.");
      }
      if (idSesion && idSesion !== remitente.id) {
        throw new Error("La sesión guardada y la identidad validada no coinciden. Recargá Indiscretos con Ctrl+F5 e intentá de nuevo.");
      }
      usuario = remitente;

      // Asegurar que el perfil de alias pertenece a esta identidad autenticada.
      let perfilRemitente = await db.from("chat_profiles")
        .select("user_id,alias").eq("user_id", remitente.id).maybeSingle();
      if (perfilRemitente.error) throw perfilRemitente.error;
      if (!perfilRemitente.data) {
        const caracteres = "abcdefghjkmnpqrstuvwxyz23456789";
        let creado = null;
        let errorPerfil = null;
        for (let intento = 0; intento < 8 && !creado; intento++) {
          let aliasNuevo = "chat";
          for (let i = 0; i < 4; i++) aliasNuevo += caracteres[Math.floor(Math.random() * caracteres.length)];
          const alta = await db.from("chat_profiles")
            .insert({user_id:remitente.id, alias:aliasNuevo})
            .select("user_id,alias").single();
          if (!alta.error) creado = alta.data;
          else {
            errorPerfil = alta.error;
            if (alta.error.code !== "23505") break;
          }
        }
        if (!creado) throw errorPerfil || new Error("No se pudo crear el perfil para esta sesión.");
        chatAliasActual = creado.alias;
        if ($("#chatOwnAlias")) $("#chatOwnAlias").textContent = chatAliasActual;
      }

      const r = await db.from("direct_messages")
        .insert({sender_id:remitente.id, recipient_id:chat.userId, content:texto})
        .select("id,sender_id,recipient_id,content,created_at").single();
      if (r.error) throw r.error;
      const lista = leerMensajesLocales(chat.userId);
      lista.push(r.data);
      guardarMensajesLocales(chat.userId, lista);
      $("#chatMessageInput").value = "";
      await actualizarMensajesChat();
    } catch (error) {
      console.error("Error al enviar mensaje privado:", error);
      const detalle = [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(" — ");
      avisar(detalle ? "Error de Supabase: " + detalle.slice(0, 180) : "No se pudo enviar. Abrí la consola (F12) para ver el error.");
    } finally { boton.disabled = false; }
  });
  $("#chatRenameBtn")?.addEventListener("click", () => {
    const chat = buscarChatGuardado(chatActivoId);
    if (!chat) return;
    const nombre = prompt("¿Qué nombre querés ponerle a este chat?", chat.title || chat.alias);
    if (nombre === null) return;
    const limpio = nombre.trim().slice(0, 40);
    if (!limpio) { avisar("El nombre no puede quedar vacío."); return; }
    chat.title = limpio;
    guardarChatsGuardados();
    $("#chatRoomTitle").textContent = limpio;
    dibujarChatsGuardados();
  });
  $("#chatDeleteBtn")?.addEventListener("click", () => {
    const chat = buscarChatGuardado(chatActivoId);
    if (!chat || !confirm("¿Seguro que querés borrar este chat guardado? Se eliminará de este navegador, pero no del chat de la otra persona.")) return;
    try { localStorage.removeItem(mensajesLocalKey(chat.userId)); } catch (_) {}
    const idx = chatsGuardados.findIndex(c => c.userId === chat.userId);
    if (idx >= 0) chatsGuardados.splice(idx, 1);
    guardarChatsGuardados();
    chatActivoId = "";
    $("#chatRoom").classList.add("hidden");
    if (chatRefreshTimer) clearInterval(chatRefreshTimer);
    dibujarChatsGuardados();
    avisar("Chat eliminado de este navegador.");
  });

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

  // Al volver a la pestaña (especialmente en PC), refrescar la bandeja y el chat abierto.
  // El intervalo puede pausarse cuando el navegador deja la pestaña en segundo plano.
  async function refrescarMensajesAlVolver() {
    if (document.hidden || !db || !usuario) return;
    await sincronizarChatsEntrantes();
    const mensajesVisible = $("#view-mensajes") && !$("#view-mensajes").classList.contains("hidden");
    const salaVisible = $("#chatRoom") && !$("#chatRoom").classList.contains("hidden");
    if (chatActivoId && mensajesVisible && salaVisible && !$("#chatMessageInput")?.value) {
      await actualizarMensajesChat();
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refrescarMensajesAlVolver();
  });
  window.addEventListener("focus", () => refrescarMensajesAlVolver());

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
      await iniciarMensajesPrivados();
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