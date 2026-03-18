exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: ""
    };
  }

  const body = JSON.parse(event.body);
  console.log("Body recibido:", JSON.stringify(body).slice(0, 200));

  // Si es una llamada de IA
  if (body.prompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: body.max_tokens || 1000,
        messages: [{ role: "user", content: body.prompt }]
      })
    });
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  }

  // Si es guardar en Airtable
  if (body.guardar) {
    console.log("Guardando en Airtable:", JSON.stringify(body.guardar));
    const d = body.guardar;
    const nac = new Date(d.fecha);
    const edad = isNaN(nac) ? "-" : Math.floor((Date.now() - nac) / (1000 * 60 * 60 * 24 * 365.25));

    const airtableBody = {
      records: [{
        fields: {
          "Nombre": d.nombre || "",
          "Email": d.email || "",
          "Sexo": d.sexo || "",
          "Fecha nacimiento": d.fecha || "",
          "Edad": String(edad),
          "Localidad": d.localidad || "",
          "Estado civil": d.civil || "",
          "Situacion": d.situacion || "",
          "Herramienta": d.herramienta || "",
          "Perfil": d.perfil || "",
          "Fecha y hora": new Date().toLocaleString("es-AR")
        }
      }]
    };

    console.log("Enviando a Airtable:", JSON.stringify(airtableBody));

    const response = await fetch(
      "https://api.airtable.com/v0/appU6FgViscyxhJSO/tbl7l56KwRXtY8xR2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(airtableBody)
      }
    );
    const data = await response.json();
    console.log("Respuesta Airtable:", JSON.stringify(data));
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data)
    };
  }

  return { statusCode: 400, body: "Bad request" };
};
