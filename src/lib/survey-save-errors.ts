export type SurveySaveErrorCode = string | null | undefined;

/** Converts Supabase/Postgres errors into actionable UI messages without exposing SQL details or row data. */
export function surveySaveErrorMessage(code: SurveySaveErrorCode): string {
  switch (code) {
    case "42501":
      return "Sem permissão para criar pesquisas nesta organização. Confira se seu perfil é administrador ou gestor.";
    case "23502":
      return "O banco recusou a pesquisa porque um campo obrigatório não foi preenchido. Confira os parâmetros e tente novamente.";
    case "23503":
      return "A organização ou o usuário associado à pesquisa não foi encontrado. Atualize a sessão e tente novamente.";
    case "23505":
      return "Foi detectado um identificador duplicado para a pesquisa. Tente salvar novamente.";
    case "23514":
      return "Um dos parâmetros da pesquisa não é compatível com as regras do banco. Confira a escala e as notas de satisfação.";
    case "PGRST204":
    case "PGRST_SCHEMA_CACHE":
      return "A estrutura de dados do aplicativo está desatualizada. Atualize a configuração do banco e tente novamente.";
    default:
      return "Não foi possível criar a pesquisa. A falha foi registrada para diagnóstico; tente novamente e, se persistir, informe o suporte.";
  }
}
