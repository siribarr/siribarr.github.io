// Adapt the guest service to a static edition. All instrument reads are answered
// from the bundled data; the guest isolation layer handles the visitor's writes.
const VisitStorage = (() => {
  const prefix = "sophie-web-visit:";
  return {
    getItem(key) { return sessionStorage.getItem(prefix + key); },
    setItem(key,value) { sessionStorage.setItem(prefix + key,value); },
    removeItem(key) { sessionStorage.removeItem(prefix + key); },
    clear() {
      for (const key of Object.keys(sessionStorage))
        if (key.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  };
})();
window.fetch = async function editionRead(input, options = {}) {
  const url = new URL(typeof input === "string" ? input : input.url, location.href);
  const path = url.pathname;
  if (url.origin !== location.origin || (options.method || "GET") !== "GET")
    return new Response(null, {status:403});
  if (Object.hasOwn(Edition.data,path)) return Response.json(Edition.data[path]);
  if (path === "/catalog/v2/entries") return new Response("<feed/>");
  if (path.startsWith("/article/")) {
    const topic = Edition.data["/content.json"].find(t => path === "/article/" + t.slug);
    if (topic) {
      const heading = document.createElement("h1");
      heading.id = "firstHeading";
      heading.textContent = topic.title;
      const article = document.createElement("div");
      article.className = "mw-parser-output";
      for (const text of topic.paragraphs) {
        const p = document.createElement("p");
        p.textContent = text;
        article.append(p);
      }
      return new Response(heading.outerHTML + article.outerHTML);
    }
  }
  return new Response(null, {status:404});
};
