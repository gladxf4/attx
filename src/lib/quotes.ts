export function getGoofyQuote(percentage: number): { quote: string; tier: "safe" | "caution" | "critical" } {
  if (percentage >= 80) {
    const quotes = [
      "You have enough attendance buffer to sleep through the next rain alarm.",
      "Comfortably above 80%. Even your faculty probably won't notice if you take Friday off.",
      "Academic cushion secured. Go grab a canteen chai, you can afford a bunk.",
      "Attendance higher than average. You're chilling until finals.",
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "safe",
    };
  }

  if (percentage >= 75) {
    const quotes = [
      "Safe for MT2. The proctor will let you into the exam hall with zero drama.",
      "Right above 75%. You have some bunks, just don't burn them all in one day.",
      "Calculated survival: eligible for exams, safe from debarment notices.",
      "Clean record for midterms. Maintain the streak and you're good.",
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "safe",
    };
  }

  if (percentage >= 70) {
    const quotes = [
      "Just under 75%. Skip the canteen samosa and catch the 9 AM lecture.",
      "Borderline zone. One unexcused bunk and you're collecting teacher signatures.",
      "A couple of consecutive classes will pull you back into the green.",
      "Lock in for the next few days to secure your MT2 admit card.",
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "caution",
    };
  }

  const quotes = [
    "Below 70%. Time to sit in the first row and nod at every single sentence.",
    "Critical zone. You need a solid attendance streak between now and MT2.",
    "Debarment risk is real. Tell your roommate to drag you to class tomorrow.",
    "Don't miss a single period until midterms start.",
  ];
  return {
    quote: quotes[Math.floor(Math.random() * quotes.length)],
    tier: "critical",
  };
}
