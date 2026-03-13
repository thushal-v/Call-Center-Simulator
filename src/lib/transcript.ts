export interface TranscriptGeneratorFields {
  roleAndTask: string;
  scenarioContext: string;
  coachingApproach: string;
  toneAndStyle: string;
  lengthAndDepth: string;
  keyElements: string;
  language: string;
  finalInstruction: string;
}

export const DEFAULT_FIELDS: TranscriptGeneratorFields = {
  roleAndTask: `You are an expert contact-center performance coach and conversation writer.

Your task is to generate a fictitious but realistic coaching session transcript between a Coach and an Agent.`,

  scenarioContext: `The session is a 1:1 coaching conversation focused on declining QA performance.

The Agent's QA score has recently trended downward after a period of acceptable or strong performance.

The Coach's goal is to understand what's happening, explore root causes, and partner with the Agent on solutions.

The Agent is engaged, reflective, and open to improvement (not defensive).`,

  coachingApproach: `The conversation should implicitly follow the GROW coaching methodology:

Clarify the current situation and desired outcomes

Explore challenges, obstacles, and contributing factors

Generate options and commit to next steps

End with encouragement and a clear action plan`,

  toneAndStyle: `Professional, supportive, and constructive

Natural, conversational pacing (not scripted or robotic)

Thoughtful pauses, clarifying questions, and reflective responses

No jargon overload; clear and human language

Transcript Requirements (Important for Text-to-Speech):

The transcript must use only two speaker labels:

Coach:

Agent:

Each speaker should speak in complete sentences

Avoid bullet points, headings, or stage directions

Ensure the entire transcript can be copied and pasted as plain text`,

  lengthAndDepth: `The transcript should be long enough to represent a 5-minute coaching session

The conversation should feel unrushed, with back-and-forth dialogue`,

  keyElements: `Discussion of:

The QA score trend and what's changed

Specific behaviors or categories contributing to the decline

External or internal factors impacting performance

A collaborative action plan with 2-3 concrete next steps

A follow-up check-in commitment`,

  language: `The conversation must be conducted in English`,

  finalInstruction: `Generate the full coaching session transcript now.`,
};

export interface TranscriptPreset {
  id: string;
  label: string;
  fields: TranscriptGeneratorFields;
}

export const TRANSCRIPT_PRESETS: TranscriptPreset[] = [
  {
    id: "qa-performance",
    label: "QA Performance Coaching",
    fields: DEFAULT_FIELDS,
  },
  {
    id: "escalation-handling",
    label: "Customer Escalation Handling",
    fields: {
      roleAndTask: `You are an expert contact-center performance coach and conversation writer.

Your task is to generate a fictitious but realistic coaching session transcript between a Coach and an Agent.`,

      scenarioContext: `The session is a 1:1 coaching conversation focused on improving de-escalation skills.

The Agent has received feedback about struggling to handle angry or frustrated customers, leading to longer call times and lower customer satisfaction scores.

The Coach's goal is to review recent interactions, identify patterns, and help the Agent develop effective de-escalation techniques.

The Agent is receptive and motivated to improve but feels overwhelmed by hostile callers.`,

      coachingApproach: `The conversation should implicitly follow the GROW coaching methodology:

Clarify the current challenges with escalated calls

Explore specific situations where de-escalation failed or succeeded

Generate practical techniques and scripts for handling angry customers

End with role-play commitments and a practice plan`,

      toneAndStyle: `Professional, supportive, and constructive

Natural, conversational pacing (not scripted or robotic)

Thoughtful pauses, clarifying questions, and reflective responses

No jargon overload; clear and human language

Transcript Requirements (Important for Text-to-Speech):

The transcript must use only two speaker labels:

Coach:

Agent:

Each speaker should speak in complete sentences

Avoid bullet points, headings, or stage directions

Ensure the entire transcript can be copied and pasted as plain text`,

      lengthAndDepth: `The transcript should be long enough to represent a 5-minute coaching session

The conversation should feel unrushed, with back-and-forth dialogue`,

      keyElements: `Discussion of:

Recent examples of escalated customer interactions

Emotional triggers and how the Agent currently responds

Specific de-escalation techniques (empathy statements, acknowledgment, pacing)

A practice scenario or role-play commitment

2-3 actionable next steps for the Agent's upcoming shifts`,

      language: `The conversation must be conducted in English`,

      finalInstruction: `Generate the full coaching session transcript now.`,
    },
  },
  {
    id: "compliance-adherence",
    label: "Compliance & Policy Adherence",
    fields: {
      roleAndTask: `You are an expert contact-center performance coach and conversation writer.

Your task is to generate a fictitious but realistic coaching session transcript between a Coach and an Agent.`,

      scenarioContext: `The session is a 1:1 coaching conversation focused on compliance and policy adherence gaps.

Recent quality audits have flagged the Agent for missing required disclosures, skipping verification steps, or not following mandatory call scripts in regulated interactions.

The Coach's goal is to understand why the gaps are occurring, reinforce the importance of compliance, and help the Agent build habits to stay compliant.

The Agent takes their work seriously and is not intentionally cutting corners but has developed shortcuts under time pressure.`,

      coachingApproach: `The conversation should implicitly follow the GROW coaching methodology:

Clarify which specific compliance areas were flagged

Explore root causes — time pressure, unclear procedures, knowledge gaps

Generate solutions — reminders, checklists, workflow adjustments

End with clear commitments and a follow-up audit plan`,

      toneAndStyle: `Professional, supportive, and constructive

Natural, conversational pacing (not scripted or robotic)

Thoughtful pauses, clarifying questions, and reflective responses

No jargon overload; clear and human language

Transcript Requirements (Important for Text-to-Speech):

The transcript must use only two speaker labels:

Coach:

Agent:

Each speaker should speak in complete sentences

Avoid bullet points, headings, or stage directions

Ensure the entire transcript can be copied and pasted as plain text`,

      lengthAndDepth: `The transcript should be long enough to represent a 5-minute coaching session

The conversation should feel unrushed, with back-and-forth dialogue`,

      keyElements: `Discussion of:

Specific compliance violations found in recent audits

The required disclosures or verification steps that were missed

Root causes — time pressure, confusing procedures, or lack of training

The business and legal consequences of non-compliance

A concrete plan with 2-3 steps to build compliant habits

A follow-up audit or check-in commitment`,

      language: `The conversation must be conducted in English`,

      finalInstruction: `Generate the full coaching session transcript now.`,
    },
  },
];

export function assemblePrompt(fields: TranscriptGeneratorFields): string {
  return `${fields.roleAndTask}

## Scenario Context
${fields.scenarioContext}

## Coaching Approach
${fields.coachingApproach}

## Tone & Style
${fields.toneAndStyle}

## Length & Depth
${fields.lengthAndDepth}

## Key Elements to Include
${fields.keyElements}

## Language
${fields.language}

## Final Instruction
${fields.finalInstruction}`;
}
