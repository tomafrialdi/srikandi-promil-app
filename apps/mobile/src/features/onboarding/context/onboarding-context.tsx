import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { submitOnboarding } from "../services/onboarding-api";
import type {
  AnswerValue,
  ResultValues,
  Answers,
  OnboardingConfig,
  StepErrors,
} from "../types";
import { buildPayload } from "../utils/payload";
import { calculateResult } from "../utils/result";
import { flattenFields, validateStep } from "../utils/validate";

interface OnboardingContextValue {
  config: OnboardingConfig;
  answers: Answers;
  errors: StepErrors;
  /** Predictions derived from the answers; null until the required answers exist. */
  result: ResultValues | null;
  setAnswer: (key: string, value: AnswerValue) => void;
  /** Validates a step, stores its errors, and returns true when it passes. */
  validate: (stepIndex: number) => boolean;
  /**
   * Saves the answers to the backend. Call it once the user is signed in; resolves
   * without doing anything when the questionnaire wasn't completed (e.g. a plain login).
   */
  submit: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function initialAnswers(config: OnboardingConfig): Answers {
  const answers: Answers = {};
  for (const step of config.steps) {
    for (const field of flattenFields(step.fields)) {
      if ("defaultValue" in field && field.defaultValue !== undefined) {
        answers[field.key] = field.defaultValue;
      }
    }
  }
  return answers;
}

export function OnboardingProvider({
  config,
  children,
}: {
  config: OnboardingConfig;
  children: ReactNode;
}) {
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(config));
  const [errors, setErrors] = useState<StepErrors>({});

  const setAnswer = useCallback((key: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const validate = useCallback(
    (stepIndex: number) => {
      const stepErrors = validateStep(config.steps[stepIndex], answers);
      setErrors(stepErrors);
      return Object.keys(stepErrors).length === 0;
    },
    [config, answers],
  );

  const submit = useCallback(async () => {
    const complete = config.steps.every(
      (step) => Object.keys(validateStep(step, answers)).length === 0,
    );
    if (complete) await submitOnboarding(buildPayload(config, answers));
  }, [config, answers]);

  // TODO(backend): replace the local estimate with the server-side prediction.
  const result = useMemo(() => calculateResult(answers), [answers]);

  const value = useMemo(
    () => ({ config, answers, errors, result, setAnswer, validate, submit }),
    [config, answers, errors, result, setAnswer, validate, submit],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  return ctx;
}
