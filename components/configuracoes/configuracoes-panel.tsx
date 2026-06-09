"use client";

import { useCallback, useEffect, useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { roleLabel } from "@/lib/role-label";
import { Loader2, Building2, User, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { OpeningHoursEditor } from "@/components/configuracoes/opening-hours-editor";
import {
  emptyOpeningHours,
  parseOpeningHours,
  serializeOpeningHours,
  validateOpeningHoursData,
  type OpeningHoursData,
} from "@/lib/opening-hours";

type TabId = "clinica" | "usuarios" | "conta";

type Settings = {
  id: string;
  clinicName: string;
  clinicPhone: string | null;
  clinicEmail: string | null;
  clinicAddress: string | null;
  openingHours: string | null;
  appointmentMinutes: number;
  siteWelcomeMessage: string | null;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
};

type Props = {
  currentUserId: string;
};

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "clinica", label: "Clínica", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "conta", label: "Minha conta", icon: User },
];

const ROLES: Role[] = [Role.ADMIN, Role.RECEPCAO, Role.MEDICO, Role.VENDEDOR];

export function ConfiguracoesPanel({ currentUserId }: Props) {
  const [tab, setTab] = useState<TabId>("clinica");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [openingSchedule, setOpeningSchedule] = useState<OpeningHoursData>(emptyOpeningHours);
  const [openingLegacyHint, setOpeningLegacyHint] = useState<string | null>(null);
  const [appointmentMinutes, setAppointmentMinutes] = useState("30");
  const [siteWelcomeMessage, setSiteWelcomeMessage] = useState("");

  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState(false);
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uRole, setURole] = useState<Role>(Role.RECEPCAO);
  const [uActive, setUActive] = useState(true);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/settings", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao carregar.");
    const s = data.settings as Settings;
    setSettings(s);
    setClinicName(s.clinicName);
    setClinicPhone(s.clinicPhone ?? "");
    setClinicEmail(s.clinicEmail ?? "");
    setClinicAddress(s.clinicAddress ?? "");
    const parsed = parseOpeningHours(s.openingHours);
    setOpeningSchedule(parsed.data);
    setOpeningLegacyHint(parsed.legacyText);
    setAppointmentMinutes(String(s.appointmentMinutes));
    setSiteWelcomeMessage(s.siteWelcomeMessage ?? "");
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao carregar usuários.");
    setUsers(data.users as UserRow[]);
  }, []);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/users/me", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao carregar perfil.");
    setProfileName(data.user.name);
    setProfileEmail(data.user.email);
  }, []);

  const refresh = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      if (tab === "clinica") await loadSettings();
      else if (tab === "usuarios") await loadUsers();
      else await loadProfile();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }, [tab, loadSettings, loadUsers, loadProfile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function resetUserForm() {
    setEditingUserId(null);
    setNewUser(false);
    setUName("");
    setUEmail("");
    setUPassword("");
    setURole(Role.RECEPCAO);
    setUActive(true);
  }

  function startEditUser(u: UserRow) {
    setNewUser(false);
    setEditingUserId(u.id);
    setUName(u.name);
    setUEmail(u.email);
    setUPassword("");
    setURole(u.role);
    setUActive(u.active);
    setMsg(null);
  }

  function startNewUser() {
    resetUserForm();
    setNewUser(true);
    setMsg(null);
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    const hoursError = validateOpeningHoursData(openingSchedule);
    if (hoursError) {
      setErr(hoursError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName,
          clinicPhone: clinicPhone || null,
          clinicEmail: clinicEmail || null,
          clinicAddress: clinicAddress || null,
          openingHours: serializeOpeningHours(openingSchedule),
          appointmentMinutes: Number(appointmentMinutes),
          siteWelcomeMessage: siteWelcomeMessage || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Não foi possível salvar.");
        setLoading(false);
        return;
      }
      setMsg("Configurações da clínica salvas.");
      await loadSettings();
    } catch {
      setErr("Erro de conexão.");
    }
    setLoading(false);
  }

  async function saveUser(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      if (newUser) {
        const res = await fetch("/api/users", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: uName, email: uEmail, password: uPassword, role: uRole }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : "Não foi possível criar.");
          setLoading(false);
          return;
        }
        resetUserForm();
        setMsg("Usuário criado.");
      } else if (editingUserId) {
        const body: Record<string, unknown> = {
          name: uName,
          role: uRole,
          active: uActive,
        };
        if (uPassword.trim()) body.password = uPassword;
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(typeof data.error === "string" ? data.error : "Não foi possível atualizar.");
          setLoading(false);
          return;
        }
        resetUserForm();
        setMsg("Usuário atualizado.");
      }
      await loadUsers();
    } catch {
      setErr("Erro de conexão.");
    }
    setLoading(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Não foi possível salvar.");
        setLoading(false);
        return;
      }
      setMsg("Nome atualizado.");
    } catch {
      setErr("Erro de conexão.");
    }
    setLoading(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: curPass,
          newPassword: newPass,
          confirmPassword: confirmPass,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Não foi possível alterar a senha.");
        setLoading(false);
        return;
      }
      setCurPass("");
      setNewPass("");
      setConfirmPass("");
      setMsg("Senha alterada com sucesso.");
    } catch {
      setErr("Erro de conexão.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 md:px-8">
      <div className="rounded-3xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        Área restrita à <strong>administração</strong>: dados da clínica, usuários do sistema e sua conta.
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-brand-600 text-white shadow-sm" : "text-ink-600 hover:bg-slate-100",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {msg}
        </div>
      ) : null}

      {tab === "clinica" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink-900">Dados da clínica</h2>
          {loading && !settings ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <form onSubmit={saveSettings} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinicName">Nome da ótica / clínica</Label>
                <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicPhone">Telefone</Label>
                <Input id="clinicPhone" value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicEmail">E-mail de contato</Label>
                <Input id="clinicEmail" type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinicAddress">Endereço</Label>
                <Input id="clinicAddress" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Horário de funcionamento</Label>
                <OpeningHoursEditor
                  value={openingSchedule}
                  onChange={setOpeningSchedule}
                  legacyHint={openingLegacyHint}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentMinutes">Duração padrão da consulta (min)</Label>
                <Input
                  id="appointmentMinutes"
                  type="number"
                  min={15}
                  max={180}
                  value={appointmentMinutes}
                  onChange={(e) => setAppointmentMinutes(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="siteWelcome">Mensagem de boas-vindas (site)</Label>
                <Textarea
                  id="siteWelcome"
                  value={siteWelcomeMessage}
                  onChange={(e) => setSiteWelcomeMessage(e.target.value)}
                  rows={3}
                  placeholder="Texto opcional exibido no site público."
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar configurações"}
                </Button>
              </div>
            </form>
          )}
        </section>
      )}

      {tab === "usuarios" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section
            className={cn(
              "rounded-3xl border bg-white p-6 shadow-sm",
              editingUserId || newUser ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200/80",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {newUser ? "Novo usuário" : editingUserId ? "Editar usuário" : "Usuário"}
              </h2>
              {!newUser && !editingUserId ? (
                <Button type="button" size="sm" onClick={startNewUser}>
                  Adicionar
                </Button>
              ) : null}
            </div>
            {(newUser || editingUserId) && (
              <form onSubmit={saveUser} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uName">Nome</Label>
                  <Input id="uName" value={uName} onChange={(e) => setUName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uEmail">E-mail (login)</Label>
                  <Input
                    id="uEmail"
                    type="email"
                    value={uEmail}
                    onChange={(e) => setUEmail(e.target.value)}
                    required
                    disabled={!!editingUserId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uRole">Perfil de acesso</Label>
                  <select
                    id="uRole"
                    value={uRole}
                    onChange={(e) => setURole(e.target.value as Role)}
                    disabled={editingUserId === currentUserId}
                    className="flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
                {editingUserId ? (
                  <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
                    <input
                      type="checkbox"
                      checked={uActive}
                      onChange={(e) => setUActive(e.target.checked)}
                      disabled={editingUserId === currentUserId}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    />
                    Usuário ativo
                  </label>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="uPassword">
                    {editingUserId ? "Nova senha (opcional)" : "Senha inicial"}
                  </Label>
                  <Input
                    id="uPassword"
                    type="password"
                    value={uPassword}
                    onChange={(e) => setUPassword(e.target.value)}
                    required={!editingUserId}
                    minLength={6}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : newUser ? "Criar" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetUserForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
            {!newUser && !editingUserId ? (
              <p className="mt-4 text-sm text-ink-600">Selecione um usuário na lista ou clique em Adicionar.</p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-900">Equipe cadastrada</h2>
            {loading && !users ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            ) : !users?.length ? (
              <p className="mt-4 text-sm text-ink-600">Nenhum usuário.</p>
            ) : (
              <ul className="mt-4 max-h-[480px] space-y-2 overflow-auto">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm",
                      editingUserId === u.id ? "border-brand-300 bg-brand-50/80" : "border-slate-100 bg-slate-50/80",
                      !u.active && "opacity-60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink-900">{u.name}</p>
                        <p className="text-xs text-ink-500">
                          {u.email} · {roleLabel(u.role)}
                          {!u.active ? " · Inativo" : ""}
                          {u.id === currentUserId ? " · Você" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-700 hover:underline"
                        onClick={() => startEditUser(u)}
                      >
                        Editar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "conta" && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-900">Meu perfil</h2>
            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileEmail">E-mail</Label>
                <Input id="profileEmail" value={profileEmail} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileName">Nome exibido</Label>
                <Input id="profileName" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar nome"}
              </Button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-900">Alterar senha</h2>
            <form onSubmit={savePassword} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="curPass">Senha atual</Label>
                <Input id="curPass" type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPass">Nova senha</Label>
                <Input id="newPass" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass">Confirmar nova senha</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar senha"}
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
