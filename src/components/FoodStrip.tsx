const FOODS = [
  "Ragi Mudde",
  "Neer Dosa",
  "Akki Rotti",
  "Bisi Bele Bath",
  "Chicken Sukka",
  "Filter Coffee",
];

export function FoodStrip() {
  return (
    <div className="sdp-food-strip">
      <p className="sdp-wrap sdp-food-strip-line">
        A Belly Fat Plan Built Around{" "}
        {FOODS.map((f, i) => (
          <span key={f}>
            {i > 0 && " · "}
            <em>{f}</em>
          </span>
        ))}{" "}
        &amp; Your Sunday Biryani
      </p>
    </div>
  );
}

export default FoodStrip;
