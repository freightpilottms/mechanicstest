export type MockQuestion = {
    id: number;
    title: string;
    vehicle: string;
    symptoms: string[];
  };
  
  export const mockQuestions: MockQuestion[] = [
    {
      id: 1,
      title: "Loss of power under load",
      vehicle: "Audi A4 B8 2.0 TDI",
      symptoms: [
        "Car starts normally",
        "Idle is smooth",
        "Under hard acceleration it sometimes goes into limp mode",
        "No smoke",
        "After restart it drives normally again",
      ],
    },
    {
      id: 2,
      title: "Warm start issue",
      vehicle: "BMW F30 320d",
      symptoms: [
        "Cold start is perfect",
        "Warm engine cranks longer",
        "No fault codes stored",
        "Once started, engine runs perfectly",
      ],
    },
    {
      id: 3,
      title: "Rough cruising",
      vehicle: "VW Passat 2.0 TDI",
      symptoms: [
        "Idle is normal",
        "At constant speed around 80–100 km/h the car slightly jerks",
        "When accelerating harder the symptom disappears",
        "No smoke and no warning lights",
      ],
    },
    {
      id: 4,
      title: "Oil consumption question",
      vehicle: "Audi A5 1.8 TFSI",
      symptoms: [
        "Engine runs fine",
        "Owner reports regular oil top-ups",
        "No visible leaks",
        "No blue smoke during normal driving",
      ],
    },
    {
      id: 5,
      title: "Vibration under acceleration",
      vehicle: "Audi A6 C7",
      symptoms: [
        "Steering wheel shakes under acceleration",
        "Gear lever also vibrates",
        "At idle it is mostly normal",
        "No dashboard warning lights",
      ],
    },
    {
      id: 6,
      title: "DPF warning after driving",
      vehicle: "VW Golf 6 1.6 TDI",
      symptoms: [
        "Car has normal power",
        "After 10–15 minutes DPF light comes on",
        "Cooling fan runs often",
        "Fuel consumption slightly increased",
      ],
    },
    {
      id: 7,
      title: "Temperature drop downhill",
      vehicle: "Audi Q5 2.0 TDI",
      symptoms: [
        "Engine reaches 90°C in city driving",
        "Stays near 90°C uphill",
        "On long downhill sections temperature drops noticeably",
        "Cabin heating still works",
      ],
    },
    {
      id: 8,
      title: "Cold start rattle",
      vehicle: "Audi A6 3.0 TDI",
      symptoms: [
        "Rattle is heard for a few seconds on cold start",
        "After oil pressure builds, sound disappears",
        "Warm starts are quieter",
        "No warning lights",
      ],
    },
    {
      id: 9,
      title: "Weak throttle response",
      vehicle: "VW Golf 6 1.6 TDI",
      symptoms: [
        "Car starts and idles normally",
        "Throttle response feels delayed all the time",
        "No smoke",
        "No limp mode",
        "Fuel consumption is normal",
      ],
    },
    {
      id: 10,
      title: "Low oil level display question",
      vehicle: "Audi A4 B8",
      symptoms: [
        "Digital oil indicator shows level between MIN and MAX",
        "Owner asks whether more oil should be added",
        "No oil warning light",
      ],
    },
  ];