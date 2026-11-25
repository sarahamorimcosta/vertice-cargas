(() => {
  const S = window.SITE || {};
  const num = String((S.whatsapp && S.whatsapp.numero) || "").replace(/\D/g, "");
  const wa = (msg) => `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;

  /* ── Links de WhatsApp (data-whats pode trazer a própria mensagem) ── */
  document.querySelectorAll("[data-whats]").forEach((el) => {
    el.href = wa(el.dataset.whats || (S.whatsapp && S.whatsapp.mensagem) || "");
  });

  /* ── Viagem: em que cena estamos e quanto já andamos nela ─────────── */
  const cenas = [...document.querySelectorAll("[data-cena]")];
  const estado = () => {
    const meio = scrollY + innerHeight * 0.5;
    const c = cenas.map((s) => s.offsetTop + s.offsetHeight * 0.5);
    let i = 0, f = 0;
    if (meio >= c[c.length - 1]) { i = c.length - 1; }
    else if (meio > c[0]) {
      while (meio >= c[i + 1]) i++;
      f = (meio - c[i]) / (c[i + 1] - c[i]);
    }
    const total = document.documentElement.scrollHeight - innerHeight;
    return { i, f: Math.min(1, Math.max(0, f)), n: cenas.length, p: Math.min(1, Math.max(0, scrollY / (total || 1))) };
  };
  window.VIAGEM = { estado };

  /* ── Painel de rastreio ───────────────────────────────────────────── */
  const rastreio = document.querySelector(".rastreio");
  const elKm = document.querySelector("[data-km]");
  const elStatus = document.querySelector("[data-status]");
  const elBarra = document.querySelector("[data-barra]");
  const paradas = [...document.querySelectorAll("[data-parada]")];
  const status = ["AGUARDANDO COLETA", "CARREGANDO NO PORTO", "EM TRÂNSITO", "CROSS-DOCKING NO CD", "MONITORADA VIA SATÉLITE", "EM TRÂNSITO", "LIBERADA P/ CADASTRO", "PRONTA P/ COTAÇÃO"];
  const paradaDe = [0, 1, 2, 3, 3, 4, 4, 4];
  const topo = document.querySelector(".topo");

  const atualizar = () => {
    const e = estado();
    topo.classList.toggle("rolou", scrollY > 40);
    rastreio.classList.toggle("visivel", scrollY > innerHeight * 0.35);
    elKm.textContent = String(Math.round(e.p * 1184)).padStart(4, "0");
    elStatus.textContent = status[e.i] || status[0];
    elBarra.style.width = (e.p * 100).toFixed(1) + "%";
    const atual = paradaDe[e.i] || 0;
    paradas.forEach((li, k) => { li.classList.toggle("feita", k < atual); li.classList.toggle("atual", k === atual); });
  };
  addEventListener("scroll", atualizar, { passive: true });
  addEventListener("resize", atualizar);
  atualizar();

  /* ── Revelar ao rolar ─────────────────────────────────────────────── */
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll(".revelar").forEach((el) => io.observe(el));
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── Manifesto de cotação → WhatsApp ──────────────────────────────── */
  const form = document.querySelector(".manifesto");
  if (form) {
    const aviso = form.querySelector(".manifesto-aviso");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      let ok = true;
      form.querySelectorAll("[required]").forEach((c) => {
        const bom = c.value.trim().length > 1;
        c.closest("label").classList.toggle("erro", !bom);
        if (!bom) ok = false;
      });
      if (!ok) { aviso.textContent = "Preencha os campos destacados."; return; }
      const d = Object.fromEntries(new FormData(form));
      const data = d.coleta ? d.coleta.split("-").reverse().join("/") : "";
      const linhas = [
        "*Manifesto de cotação · Vértice Cargas*",
        `Empresa: ${d.empresa}`, `Nome: ${d.nome}`,
        `Origem: ${d.origem}`, `Destino: ${d.destino}`, `Tipo: ${d.tipo}`,
        d.peso && `Peso aprox.: ${d.peso} kg`, d.volumes && `Volumes/paletes: ${d.volumes}`,
        d.mercadoria && `Mercadoria: ${d.mercadoria}`, data && `Coleta desejada: ${data}`,
        d.obs && `Obs.: ${d.obs}`,
      ].filter(Boolean);
      window.open(wa(linhas.join("\n")), "_blank", "noopener");
      aviso.textContent = "Manifesto aberto no WhatsApp. É só enviar.";
    });
  }
  setTimeout(() => document.documentElement.classList.add("pronto"), 6000); // se o 3D não carregar, o site abre mesmo assim
})();
