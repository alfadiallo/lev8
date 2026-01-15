/**
 * Interview Guide Data
 * Contains all EQ/PQ/IQ sub-attributes, questions, cues, and descriptions
 */

export interface Question {
  question: string;
  followUp: string;
}

export interface SubAttribute {
  id: string;
  name: string;
  description: string;
  cues: string[];
  questions: Question[];
}

export interface Domain {
  id: string;
  name: string;
  shortDescription: string;
  icon: string;
  color: string;
  subAttributes: SubAttribute[];
}

export interface InterviewGuide {
  title: string;
  subtitle: string;
  domains: {
    EQ: Domain;
    PQ: Domain;
    IQ: Domain;
  };
}

export const interviewGuide: InterviewGuide = {
  title: "Emergency Medicine Residency Interview Guide",
  subtitle: "Comprehensive Reference with EQ, PQ, IQ Assessment Framework",
  domains: {
    EQ: {
      id: "EQ",
      name: "Emotional Quotient (EQ)",
      shortDescription: "Empathy, adaptability, communication",
      icon: "Heart",
      color: "#10B981",
      subAttributes: [
        {
          id: "empathy",
          name: "Empathy and Positive Interactions",
          description: "Candidates demonstrate genuine understanding of patient and family perspectives, respond thoughtfully to emotional needs, communicate with compassion, and adjust their approach based on individual patient circumstances. They show awareness of power dynamics, cultural differences, and vulnerability in healthcare settings.",
          cues: [
            "Watch for body language and tone when discussing vulnerable populations (does it soften? show engagement?)",
            "Note how candidate responds when you introduce them to staff during tours (respectful? engaged? genuine?)",
            "Listen for specific examples rather than generic answers (\"I try to be empathetic\" vs. \"I sat with her and...\")",
            "Assess whether they remember details that show they paid attention to the person, not just the patient"
          ],
          questions: [
            {
              question: "Tell me about a time you cared for a challenging or difficult patient. What made the situation challenging, and how did you handle it?",
              followUp: "What did you learn? How did the patient respond?"
            },
            {
              question: "Describe an experience where you had to deliver bad news to a patient or family member. Walk me through how you approached it.",
              followUp: "How did you prepare? What would you do differently?"
            },
            {
              question: "Can you share an example of a patient interaction that changed your perspective on medicine?",
              followUp: "How has that stayed with you?"
            },
            {
              question: "A patient just arrived who is frustrated and angry about their wait time. How do you approach this interaction?",
              followUp: "What if they remained angry?"
            },
            {
              question: "You realize you made an error in communication with a patient. How do you handle it?",
              followUp: "How did you restore trust?"
            }
          ]
        },
        {
          id: "adaptability",
          name: "Adaptability and Self-Awareness",
          description: "Candidates accurately recognize their strengths and limitations, seek feedback, adjust approaches when initial strategies aren't working, and demonstrate intellectual humility. They can reflect on their thinking, learn from mistakes, and grow in response to new information or perspectives.",
          cues: [
            "Does candidate answer defensively or thoughtfully?",
            "Can they identify actual weaknesses or only \"strengths disguised as weaknesses\"?",
            "Do they have concrete examples of change or just aspirational statements?"
          ],
          questions: [
            {
              question: "What would your colleagues say is your biggest weakness? How are you working to improve it?",
              followUp: "Give me a specific example of how you've worked on this."
            },
            {
              question: "Tell me about a time you realized you were wrong about something. How did you handle that realization?",
              followUp: "How did you respond to the person? What changed?"
            },
            {
              question: "Describe a clinical situation where you had to completely change your approach. What triggered that change?",
              followUp: "How quickly did you recognize the change was needed?"
            },
            {
              question: "Your attending suddenly changes the treatment plan you were about to implement. How do you respond?",
              followUp: "Walk me through your emotions and actions."
            },
            {
              question: "How do you typically respond when someone gives you feedback that stings a bit?",
              followUp: "Tell me about a specific time."
            }
          ]
        },
        {
          id: "stress",
          name: "Stress Management and Resilience",
          description: "Candidates recognize signs of stress and overwhelm in themselves, employ evidence-based coping strategies, maintain perspective under pressure, and recover effectively from challenging experiences. They prioritize personal wellness and have sustainable approaches to preventing burnout.",
          cues: [
            "Are coping strategies specific and realistic or vague?",
            "Do they describe activities that are truly restorative?",
            "Can they articulate when they're reaching limits?",
            "Do they model healthy stress management?"
          ],
          questions: [
            {
              question: "What was your most stressful clinical experience, and how did you manage it in the moment?",
              followUp: "How did you feel afterward? What helped you recover?"
            },
            {
              question: "How do you recognize when stress is affecting your performance?",
              followUp: "What's an example? What did you do?"
            },
            {
              question: "Describe a time when you were overwhelmed. What did you do?",
              followUp: "How long did recovery take?"
            },
            {
              question: "What does your self-care routine look like? How do you maintain balance between demanding clinical work and personal wellbeing?",
              followUp: "How consistent are you with this? What would help?"
            },
            {
              question: "What's your strategy for preventing burnout?",
              followUp: "How well has this worked?"
            }
          ]
        },
        {
          id: "curiosity",
          name: "Curiosity and Growth Mindset",
          description: "Candidates actively seek knowledge and learning opportunities, view mistakes as learning experiences, embrace challenges as opportunities for growth, and demonstrate engagement with emergency medicine as a field. They ask thoughtful questions and pursue understanding beyond minimum requirements.",
          cues: [
            "Do they ask thoughtful questions during the interview?",
            "Do answers show depth of thinking or surface-level responses?",
            "Can they articulate why something interests them (intrinsic motivation)?",
            "Do they show engagement when you raise new ideas?"
          ],
          questions: [
            {
              question: "What medical topic have you recently self-studied or taught yourself? Why did that interest you?",
              followUp: "How did you learn about it? What did you do with that knowledge?"
            },
            {
              question: "How do you typically stay current with emergency medicine literature and guidelines?",
              followUp: "What resources do you use? How often?"
            },
            {
              question: "Tell me about the most interesting case you've encountered. What made it interesting, and what did you learn?",
              followUp: "Have you looked up anything about it since?"
            },
            {
              question: "What do you do when you encounter a knowledge gap during patient care?",
              followUp: "Give me an example. Did you follow up?"
            },
            {
              question: "What do you want to be known for as an emergency physician?",
              followUp: "How will you work toward that?"
            }
          ]
        },
        {
          id: "communication",
          name: "Communication Effectiveness",
          description: "Candidates communicate clearly and appropriately to different audiences, adjust language and complexity based on listener needs, ensure understanding, listen actively, and organize information logically. They can explain complex concepts simply, deliver difficult messages thoughtfully, and communicate urgency effectively.",
          cues: [
            "Observe clarity and organization when the candidate presents a case",
            "Note whether they check for understanding or adjust their language appropriately",
            "Listen for whether they answer the actual question asked or go off on tangents",
            "Watch for multi-part questions: do they address all components or miss some?",
            "Do they listen to follow-up questions or seem to be preparing their next response?"
          ],
          questions: [
            {
              question: "How would you explain sepsis to a patient's family member who has no medical background?",
              followUp: "What if they asked more questions? How would you check they understood?"
            },
            {
              question: "Walk me through how you'd communicate with a family that disagrees with your clinical recommendation.",
              followUp: "What if they still refused?"
            },
            {
              question: "Tell me about a time you had to communicate something complex or urgent to a team. How did you structure that communication?",
              followUp: "How did the team respond?"
            }
          ]
        }
      ]
    },
    PQ: {
      id: "PQ",
      name: "Professional Quotient (PQ)",
      shortDescription: "Work ethic, integrity, leadership",
      icon: "Award",
      color: "#6366F1",
      subAttributes: [
        {
          id: "workethic",
          name: "Work Ethic, Reliability, and Professional Presence",
          description: "Candidates demonstrate consistent dedication to their work, follow through on commitments, maintain professional appearance and demeanor in all settings, interact respectfully with all team members regardless of role, and take initiative without being asked. They show genuine motivation for excellence and care about their impact on the team.",
          cues: [
            "Was the candidate punctual and prepared for the interview?",
            "How professional is their appearance and demeanor?",
            "Do they maintain consistent energy and engagement throughout interactions?",
            "How do they interact with administrative staff, residents, and faculty? (respectful? engaged? dismissive?)",
            "What is their body language and eye contact like?",
            "Do they seem present or distracted?"
          ],
          questions: [
            {
              question: "Tell me about a time you went above and beyond in patient care. What motivated you?",
              followUp: "What was the outcome? Why did that matter to you?"
            },
            {
              question: "Describe a shift or rotation where you felt you really made a difference. What happened?",
              followUp: "How did that feel? What did you learn?"
            },
            {
              question: "Give me an example of when you stayed late or put in extra effort for a patient or team.",
              followUp: "Would you do it again? What drives that?"
            },
            {
              question: "How do you handle tasks that aren't necessarily interesting but still need to be done?",
              followUp: "Give me a specific example."
            }
          ]
        },
        {
          id: "teachability",
          name: "Teachability and Receptiveness",
          description: "Candidates actively seek input, receive feedback without defensiveness, modify their approach based on input, ask clarifying questions, show genuine interest in learning from others, and view feedback as opportunity rather than criticism. They demonstrate intellectual humility and commitment to improvement.",
          cues: [
            "Present a brief teaching point during the interview and observe their engagement",
            "Notice whether they ask clarifying questions or simply nod",
            "See if they take notes or show genuine interest in learning from you",
            "Do they make eye contact and respond thoughtfully?"
          ],
          questions: [
            {
              question: "Tell me about a time you received feedback that was hard to hear. How did you respond?",
              followUp: "How did you feel in the moment? What changed?"
            },
            {
              question: "Describe a situation where you changed your approach based on someone's input.",
              followUp: "How do you think about that change now?"
            },
            {
              question: "Has a mentor ever corrected you on something? How did you take it?",
              followUp: "Did you apply what you learned?"
            },
            {
              question: "Your attending points out that your patient assessment was incomplete. How do you handle the rest of that shift with that attending?",
              followUp: "How would you approach the next patient?"
            }
          ]
        },
        {
          id: "integrity",
          name: "Integrity and Accountability",
          description: "Candidates take responsibility for their mistakes, demonstrate commitment to ethical practice, advocate for patients even when it's uncomfortable, handle confidentiality appropriately, and have clear moral compass. They do what's right rather than what's easy, and they're honest about limitations and errors.",
          cues: [
            "Are answers thoughtful and nuanced or simplistic?",
            "Do they blame others or take responsibility?",
            "Is there evidence of actual ethical dilemmas they've navigated?",
            "Do they seem to understand complexity or paint situations in black/white?"
          ],
          questions: [
            {
              question: "You notice a colleague making repeated documentation errors that could affect billing. What do you do?",
              followUp: "Why that approach? What stops most people from doing this?"
            },
            {
              question: "You realize your attending may have made a clinical error. How do you handle it?",
              followUp: "How would you bring it up? What concerns you about this?"
            },
            {
              question: "If you made a mistake in patient care, how would you approach telling your attending and the patient?",
              followUp: "What would make that conversation hard?"
            },
            {
              question: "Describe a situation where you had to advocate for patient safety, even when it was uncomfortable.",
              followUp: "What was the outcome? Would you do it again?"
            },
            {
              question: "Tell me about a time you took responsibility for something that didn't go well.",
              followUp: "How did you address it? What changed?"
            }
          ]
        },
        {
          id: "documentation",
          name: "Clear and Timely Documentation",
          description: "Candidates write clearly and concisely, organize information logically, communicate efficiently under time pressure, document appropriately detailed information, and understand the importance of documentation for patient care continuity and legal protection. They can prioritize documentation appropriately in busy settings.",
          cues: [
            "Can they prioritize documentation needs effectively?",
            "Do they understand documentation's impact on patient care continuity?",
            "Are they aware of legal implications of documentation?",
            "Can they articulate a clear documentation strategy under pressure?"
          ],
          questions: [
            {
              question: "How do you approach documentation when you're extremely busy?",
              followUp: "What comes first? What might you defer?"
            },
            {
              question: "What's your philosophy on documentation in emergency medicine?",
              followUp: "How does that influence what you write?"
            },
            {
              question: "You're in a packed ED. A patient with chest pain needs charting, labs are back, and two new patients just arrived. How do you prioritize documentation?",
              followUp: "Walk me through it."
            }
          ]
        },
        {
          id: "leadership",
          name: "Leadership and Relationship Building",
          description: "Candidates inspire and influence others positively, build strong working relationships, navigate conflict constructively, take initiative to improve processes, bring teams together, and demonstrate respect for all team members. They influence through credibility and relationship rather than authority alone.",
          cues: [
            "Do they show respect for all team members regardless of role?",
            "Can they give examples of constructive conflict resolution?",
            "Do they take initiative or wait to be directed?",
            "How do they describe their relationships with colleagues?"
          ],
          questions: [
            {
              question: "Tell me about a time you took on a leadership role. What did you do, and what was the outcome?",
              followUp: "How did others respond? What did you learn?"
            },
            {
              question: "Describe a time you worked effectively with a difficult team member. How did you build that relationship?",
              followUp: "What was challenging about that? How did it change over time?"
            },
            {
              question: "Describe a conflict you had with a colleague or supervisor. How did you handle it?",
              followUp: "How did it resolve? What did you learn? Would you handle it differently now?"
            },
            {
              question: "Tell me about a time you brought a team together to solve a problem.",
              followUp: "What was your approach? How did people respond?"
            }
          ]
        }
      ]
    },
    IQ: {
      id: "IQ",
      name: "Intellectual Quotient (IQ)",
      shortDescription: "Knowledge, problem-solving, reasoning",
      icon: "Brain",
      color: "#F59E0B",
      subAttributes: [
        {
          id: "knowledge",
          name: "Strong Knowledge Base",
          description: "Candidates demonstrate solid foundational knowledge appropriate to their training level, understand pathophysiology and mechanisms underlying clinical presentations, can explain clinical concepts clearly, and integrate knowledge to inform clinical reasoning. They have accurate and appropriately detailed understanding of emergency medicine core concepts.",
          cues: [
            "Can they generate appropriate differentials?",
            "Do they understand mechanisms behind clinical presentations?",
            "Can they explain concepts clearly without jargon?",
            "Is their knowledge appropriate for their training level?"
          ],
          questions: [
            {
              question: "A 52-year-old male presents with sudden onset chest pain and shortness of breath. BP 168/92, HR 112, RR 22, O2 sat 94% on room air. What are you thinking?",
              followUp: "Walk me through your differential. What would change with troponin elevation?"
            },
            {
              question: "Walk me through the pathophysiology of a patient in acute heart failure presenting with pulmonary edema.",
              followUp: "How does this guide your management?"
            },
            {
              question: "How would you explain shock to a medical student?",
              followUp: "What's the most important part they need to understand?"
            }
          ]
        },
        {
          id: "learning",
          name: "Commitment to Learning",
          description: "Candidates actively engage with learning opportunities, use evidence-based study strategies, pursue scholarly activities, maintain currency with literature and guidelines, and demonstrate intellectual curiosity about their specialty. They have clear vision for ongoing professional development and engage in intentional learning throughout their careers.",
          cues: [
            "Do they have a systematic approach to learning?",
            "Is there evidence of scholarly engagement?",
            "Can they articulate their learning strategies?",
            "Do they stay current with literature and guidelines?"
          ],
          questions: [
            {
              question: "What's your approach to learning a new diagnosis or procedure?",
              followUp: "Walk me through it. What resources do you use?"
            },
            {
              question: "How do you study? What methods work best for you?",
              followUp: "How effective has this been? Would you change anything?"
            },
            {
              question: "Have you done any research, QI projects, or scholarly work? Tell me about it.",
              followUp: "What did you learn? Would you continue this work?"
            },
            {
              question: "What podcasts, journals, or resources do you use to stay current?",
              followUp: "How regularly? What do you do with what you learn?"
            }
          ]
        },
        {
          id: "analytical",
          name: "Analytical Thinking and Problem-Solving",
          description: "Candidates think systematically through clinical problems, generate appropriate differentials, ask for relevant information strategically, consider multiple possibilities, set appropriate priorities, make decisions with incomplete information, and adjust approach based on evolving data. They demonstrate logical reasoning and organized problem-solving.",
          cues: [
            "Do they ask for strategic information?",
            "Can they articulate their reasoning process?",
            "Do they prioritize appropriately?",
            "Can they adapt when given new information?"
          ],
          questions: [
            {
              question: "A patient comes in with acute abdominal pain. You have limited information. What's your approach?",
              followUp: "What would you want to know? How would you narrow this? What would change your approach?"
            },
            {
              question: "You're the lone physician in a busy ED with five patients waiting. One has chest pain, one has a severe laceration, one has abdominal pain, one with asthma exacerbation, and one with a rash. Walk me through your priority system and why.",
              followUp: "What if the rash patient had difficulty breathing? What would change your priorities?"
            },
            {
              question: "Your ED is at capacity. A potential stroke patient arrives. What do you do?",
              followUp: "Walk me through your thinking. What are the key factors?"
            },
            {
              question: "You see something you've never seen before. What do you do?",
              followUp: "How would you problem-solve? Who would you ask? What resources would you use?"
            }
          ]
        },
        {
          id: "adaptReasoning",
          name: "Adaptability in Clinical Reasoning",
          description: "Candidates adjust their thinking when new information emerges, recognize when initial approaches aren't working, demonstrate intellectual flexibility, acknowledge limitations in knowledge, balance confidence with humility, deviate from standard protocols when clinically indicated, and learn from surprising cases. They stay open to multiple possibilities while maintaining diagnostic focus.",
          cues: [
            "Can they recognize when initial approaches aren't working?",
            "Do they balance confidence with humility?",
            "Are they open to changing their mind with new data?",
            "Do they learn from surprising cases?"
          ],
          questions: [
            {
              question: "Tell me about a time you were on the wrong diagnostic track and had to pivot.",
              followUp: "What made you change course? How did you feel? What did you learn?"
            },
            {
              question: "Describe a time you had to think outside standard protocols or guidelines.",
              followUp: "Why was the standard approach inadequate? What did you do instead?"
            },
            {
              question: "When is it appropriate to deviate from standard approaches? Give me an example.",
              followUp: "How did you make that decision? What were the risks?"
            },
            {
              question: "Tell me about a time you were surprised by a patient's presentation or outcome.",
              followUp: "What did that teach you? How does it influence you now?"
            }
          ]
        },
        {
          id: "clinical",
          name: "Clinical Performance Appropriate for Year of Training",
          description: "Candidates demonstrate clinical skills, judgment, and decision-making appropriate for their stage of training. They recognize their limitations, know when to ask for help, can perform basic procedures, make decisions under pressure, and communicate findings appropriately. They show readiness for residency-level responsibility.",
          cues: [
            "Do they have realistic self-assessment of skills?",
            "Can they describe appropriate help-seeking behavior?",
            "Do they recognize their limitations?",
            "Are they ready for residency-level responsibility?"
          ],
          questions: [
            {
              question: "What procedures are you comfortable performing? Which do you want to get better at?",
              followUp: "Why those areas? How do you practice?"
            },
            {
              question: "Tell me about a procedure you struggled with initially and how you improved.",
              followUp: "What helped you improve? Are you comfortable now?"
            },
            {
              question: "Tell me about a time you had to make a clinical decision quickly with incomplete information.",
              followUp: "How did you approach it? What was the outcome? What would you change?"
            },
            {
              question: "When do you ask for help, and how do you decide?",
              followUp: "Give me examples. How do you make that decision?"
            }
          ]
        }
      ]
    }
  }
};

/**
 * Helper to get a domain by ID
 */
export function getDomain(domainId: 'EQ' | 'PQ' | 'IQ'): Domain {
  return interviewGuide.domains[domainId];
}

/**
 * Helper to generate a question ID
 */
export function getQuestionId(domainId: string, subAttrId: string, questionIndex: number): string {
  return `${domainId}_${subAttrId}_${questionIndex}`;
}

/**
 * Get total question count
 */
export function getTotalQuestionCount(): number {
  let count = 0;
  Object.values(interviewGuide.domains).forEach(domain => {
    domain.subAttributes.forEach(attr => {
      count += attr.questions.length;
    });
  });
  return count;
}
