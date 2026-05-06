# ============================================================
# EVALUATION PIPELINE — PLANNED STRUCTURE
# ============================================================

# --- SETUP ---
# Load ground truth from Supabase (human_insights, expected_dataset=TRUE)
# Load model outputs from Supabase (all 8 models × 40 dashboards)
# Parse using parse_charts() → long_df
# Columns: model, dashboard_id, chart_id, level, generated, reference

# ============================================================
# 4.1 GENERATION SUCCESS AND DEPLOYMENT OVERVIEW
# ============================================================

# For each model × dashboard:
# - Check if output is parseable (not degenerate, not prompt-echo)
# - Flag: generation_success = True/False
# - Flag: degenerate_pattern = None / "repetition" / "prompt-echo" / "empty"
# - Count: dashboards_completed per model

# Output: deployment summary table
# Columns: model, params, transformers_version, dashboards_completed,
#          parseability_rate, degenerate_pattern, avg_inference_ms

# ============================================================
# 4.3 MODEL PERFORMANCE ACROSS SEMANTIC LEVELS
# ============================================================

# Aggregate across all models, per level
# ROUGE-L: L2, L3
# BERTScore F1 (rescale_with_baseline=True): L2, L3
# G-Eval: L3 (complementary), L4 (sole)

# Output: level × metric table
# Rows: L2, L3, L4
# Columns: ROUGE-L mean, BERTScore mean, G-Eval mean
# Aggregated across all models and all 40 dashboards

# --- ROUGE ---
# from rouge_score import rouge_scorer
# scorer = rouge_scorer.RougeScorer(['rougeL'])
# score per (generated, reference) pair
# aggregate by level

# --- BERTScore ---
# from bert_score import score
# model: roberta-large, rescale_with_baseline=True
# aggregate by level

# --- G-Eval ---
# Call Anthropic API (claude-sonnet-4-6)
# Run 3x per chart, average scores
# Rubric: coherence, grounding, relevance (L4); + visual grounding (L3)
# Store raw scores in Supabase before averaging

# ============================================================
# 4.4 MODEL PERFORMANCE ACROSS MODELS AND DASHBOARDS
# ============================================================

# --- Table 1: Main model × metric performance ---
# For each model: mean ± SD across 40 dashboards
# Columns: model, params, L2-ROUGE, L2-BERTScore,
#          L3-ROUGE, L3-BERTScore, L3-GEval, L4-GEval

# --- Table 2: Cross-dashboard consistency (SD only) ---
# For each model: SD of scores per level across 40 dashboards
# High SD = inconsistent model

# --- Table 3: Within-family parameter scaling ---
# Qwen3.5: 0.8B vs 2B — delta per metric per level
# InternVL2: 1B vs 2B — delta per metric per level

import pandas as pd
# group by model, compute mean and std per level per metric
# df.groupby(['model', 'level'])['rouge_l'].agg(['mean', 'std'])

# ============================================================
# 4.5 QUALITATIVE ANALYSIS
# ============================================================

# --- Hard dashboards ---
# Per dashboard: average score across all models, all levels
# Flag bottom N dashboards as "hardest"
# Manual inspection: what visual properties made them hard?

# --- High-scoring examples ---
# Top N chart-level outputs per model per level
# Pull generated text + reference for side-by-side

# --- Failure mode taxonomy ---
# Degenerate: repetition, prompt-echo, empty
# Hallucination: values not in image
# Generic L4: no grounding to specific L2/L3 observation
# L3 inapplicable: model wrote content instead of NOT APPLICABLE

# ============================================================
# STORAGE
# ============================================================

# Store all metric scores back to Supabase
# Table: model_evaluation_scores
# Columns: model, dashboard_id, chart_id, level,
#          rouge_l, bertscore_f1, geval_run1, geval_run2,
#          geval_run3, geval_avg, generation_success,
#          degenerate_pattern