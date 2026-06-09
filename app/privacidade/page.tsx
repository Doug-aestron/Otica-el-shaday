import Link from "next/link";
import { BrandLogoLink } from "@/components/brand/brand-logo";
import { buttonClassName } from "@/components/ui/button";

export const metadata = {
  title: "Política de Privacidade — El Shaday",
  description: "Como a El Shaday trata seus dados pessoais em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandLogoLink href="/" size="md" showName nameClassName="font-display text-lg text-ink-900" />
          <Link href="/" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-ink-600">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}
        </p>

        <article className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-ink-700 prose-headings:font-display prose-headings:text-ink-900 prose-h2:text-xl prose-h2:mt-8">
          <p>
            A <strong>El Shaday</strong> respeita sua privacidade e trata dados pessoais em conformidade com a Lei Geral
            de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <h2>1. Dados que coletamos</h2>
          <p>
            Podemos tratar: nome, telefone, CPF, e-mail, data de nascimento, endereço, histórico clínico e de saúde
            visual (anamnese), registros de consultas, receitas oftalmológicas e informações comerciais relacionadas a
            vendas na ótica.
          </p>

          <h2>2. Finalidades</h2>
          <ul>
            <li>Prestação de serviços de saúde visual e venda de produtos ópticos;</li>
            <li>Agendamento e gestão de atendimentos;</li>
            <li>Emissão de receitas e documentação clínica;</li>
            <li>Cumprimento de obrigações legais e regulatórias;</li>
            <li>Segurança do sistema e auditoria de ações internas.</li>
          </ul>

          <h2>3. Base legal</h2>
          <p>
            O tratamento baseia-se, conforme o caso, em consentimento do titular, execução de contrato ou procedimentos
            preliminares, tutela da saúde e legítimo interesse para operação segura do sistema.
          </p>

          <h2>4. Compartilhamento</h2>
          <p>
            Não vendemos seus dados. O compartilhamento ocorre apenas quando necessário para prestação do serviço
            (ex.: profissionais da clínica autorizados) ou por determinação legal.
          </p>

          <h2>5. Retenção e segurança</h2>
          <p>
            Mantemos os dados pelo tempo necessário às finalidades descritas e aplicamos medidas técnicas e organizacionais
            para proteção, incluindo controle de acesso por perfil e registro de auditoria de ações no painel interno.
          </p>

          <h2>6. Seus direitos</h2>
          <p>
            Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação
            quando cabível, informação sobre compartilhamentos e revogação do consentimento, nos canais de contato da
            ótica.
          </p>

          <h2>7. Consentimento na anamnese</h2>
          <p>
            Antes do registro clínico, solicitamos confirmação explícita de que o paciente foi informado e concorda com o
            tratamento dos dados para fins de atendimento oftalmológico, conforme esta política.
          </p>

          <h2>8. Contato</h2>
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com a recepção da El
            Shaday ou utilize os canais informados no estabelecimento.
          </p>
        </article>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} El Shaday
      </footer>
    </div>
  );
}
