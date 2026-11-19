export function getGoofyQuote(percentage: number): { quote: string; tier: "god" | "safe" | "borderline" | "critical" } {
  if (percentage >= 80) {
    const quotes = [
      "God tier attendance! Even your HOD gives you a respectful nod in the hallway.",
      "You're attending classes like college is giving out free iPhone drops. Go grab a chai, you can afford to bunk.",
      "Attendance higher than the class average GPA. Absolute academic weapon.",
      "Faculty might ask you to mark the register soon. Take a break!",
      "You have enough attendance buffer to hibernate through a couple of rainy days."
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "god"
    };
  }

  if (percentage >= 75) {
    const quotes = [
      "Safe zone achieved! You can enter the MT2 exam hall with your head held high.",
      "Calculated survival: comfortably above 75%, completely off the proctor's radar.",
      "You have safe bunks in your pocket, but spend them wisely like gold coins.",
      "Eligible for Midterms! The ERP gods smile upon your optimal effort.",
      "Living on the sweet spot of college life: maximum fun, zero debarment panic."
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "safe"
    };
  }

  if (percentage >= 70) {
    const quotes = [
      "🚨 Danger zone! The proctor is looking for you. Do not miss that 9 AM class tomorrow.",
      "You're right on the fence! Put down the canteen samosa and walk to class.",
      "Time to sit on the first bench and aggressively nod at whatever the teacher says.",
      "One unapproved bunk and you'll be running around collecting fake medical certificates.",
      "MT2 eligibility is blinking yellow. Lock in for the next few days!"
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      tier: "borderline"
    };
  }

  const quotes = [
    "🔥 Critical alert! Even the college Wi-Fi doesn't recognize your face anymore.",
    "Time to start drafting your apology email to the Dean. 100% attendance streak needed!",
    "Debarred list warning! You need to attend every single period between now and MT2.",
    "Tell your roommate to physically drag you out of bed every morning until exams.",
    "Only consecutive attendance and heavy prayers can salvage MT2 eligibility now."
  ];
  return {
    quote: quotes[Math.floor(Math.random() * quotes.length)],
    tier: "critical"
  };
}
