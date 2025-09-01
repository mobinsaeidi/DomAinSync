export async function fetchWhois(domain) {
    try {
      const res = await fetch(`http://localhost:4000/whois/${domain}`);
      const json = await res.json();
      if (json.success) {
        return json.data;
      } else {
        console.error(json.error);
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  