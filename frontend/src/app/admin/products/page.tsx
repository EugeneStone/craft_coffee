'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiJson } from '@/lib/admin';

type Product = {
  id: string;
  name: string;
  roast: string;
  notes: string;
  hint: string;
  weight: string;
  price: number;
  is_active: boolean;
};

type FormState = {
  name: string;
  roast: string;
  notes: string;
  hint: string;
  weight: string;
  price: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  roast: '',
  notes: '',
  hint: '',
  weight: '250 г',
  price: '',
  is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ products: Product[] }>('/api/admin/products');
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить зерно.');
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setNotice('');
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
    setNotice('');
  }

  async function toggleActive(p: Product) {
    setError('');
    try {
      await apiJson(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось сохранить.');
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Удалить «${p.name}»? Действие необратимо.`)) return;
    setError('');
    try {
      await apiJson(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      if (editing?.id === p.id) {
        setEditing(null);
        setFormOpen(false);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось удалить.');
    }
  }

  async function saveForm(state: FormState) {
    setError('');
    setNotice('');
    const body = {
      name: state.name.trim(),
      roast: state.roast.trim(),
      notes: state.notes.trim(),
      hint: state.hint.trim(),
      weight: state.weight.trim(),
      price: Number(state.price),
      is_active: state.is_active,
    };
    try {
      if (editing) {
        await apiJson(`/api/admin/products/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        setNotice(`Сохранили «${body.name}».`);
      } else {
        await apiJson('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setNotice(`Добавили «${body.name}».`);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось сохранить.');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-espresso-950">
          Зерно
        </h1>
        {formOpen ? (
          <button
            type="button"
            onClick={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            className="rounded-full border border-espresso-800 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-cream-100"
          >
            Закрыть форму
          </button>
        ) : (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-espresso-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800"
          >
            Добавить сорт
          </button>
        )}
      </div>

      {formOpen && (
        <ProductForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSave={(s) => void saveForm(s)}
        />
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-terra-200 bg-terra-50 p-4 text-sm text-terra-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 rounded-xl border border-caramel-300 bg-caramel-100/60 p-4 text-sm text-espresso-800">
          {notice} На сайте появится при следующей загрузке страницы.
        </p>
      )}

      {products === null ? (
        <p className="mt-8 animate-pulse text-espresso-500">Загружаем…</p>
      ) : products.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-cream-300 bg-white/60 p-8 text-center text-espresso-500">
          Сортов нет — добавьте первый.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {products.map((p) => (
            <li key={p.id}>
              <article className="rounded-2xl border border-cream-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-semibold text-espresso-700">
                        {p.roast}
                      </span>
                      <span className="text-xs text-espresso-500">{p.weight}</span>
                      {!p.is_active && (
                        <span className="rounded-full bg-terra-100 px-2.5 py-0.5 text-xs font-semibold text-terra-600">
                          скрыт с сайта
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1.5 text-lg font-semibold text-espresso-950">
                      {p.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-espresso-700">{p.notes}</p>
                    {p.hint && (
                      <p className="mt-0.5 text-xs text-espresso-500">{p.hint}</p>
                    )}
                  </div>
                  <p className="font-display text-xl font-semibold">
                    {p.price}{' '}
                    <span className="text-sm font-normal text-espresso-500">BYN</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="rounded-full bg-espresso-900 px-4 py-2 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(p)}
                    className="rounded-full border border-espresso-800 px-4 py-2 text-sm font-semibold text-espresso-900 transition-colors hover:bg-cream-100"
                  >
                    {p.is_active ? 'Скрыть с сайта' : 'Показать на сайте'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(p)}
                    className="rounded-full border border-terra-300 px-4 py-2 text-sm font-semibold text-terra-600 transition-colors hover:bg-terra-50"
                  >
                    Удалить
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({
  initial,
  onSave,
}: {
  initial: Product | null;
  onSave: (state: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          roast: initial.roast,
          notes: initial.notes,
          hint: initial.hint,
          weight: initial.weight,
          price: String(initial.price),
          is_active: initial.is_active,
        }
      : EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = 'Название сорта.';
    if (form.roast.trim().length < 2) errors.roast = 'Степень обжарки.';
    if (form.notes.trim().length < 2) errors.notes = 'Вкусовые ноты.';
    if (!/^\d{1,5}$/.test(form.price.trim())) errors.price = 'Цена — целое число.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSave(form);
  }

  const inputCls =
    'mt-1.5 w-full rounded-xl border border-cream-300 bg-cream-50/50 px-4 py-2.5 focus:border-caramel-500';

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-semibold">
        {initial ? `Редактируем: ${initial.name}` : 'Новый сорт'}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="text-sm font-semibold">
            Название
          </label>
          <input
            id="p-name"
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Эфиопия Иргачеффе"
            className={inputCls}
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-terra-600">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="p-roast" className="text-sm font-semibold">
            Обжарка
          </label>
          <input
            id="p-roast"
            type="text"
            value={form.roast}
            onChange={(e) => set('roast', e.target.value)}
            placeholder="Светлая"
            className={inputCls}
          />
          {fieldErrors.roast && <p className="mt-1 text-sm text-terra-600">{fieldErrors.roast}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="p-notes" className="text-sm font-semibold">
            Вкусовые ноты
          </label>
          <input
            id="p-notes"
            type="text"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="цветочный, бергамот"
            className={inputCls}
          />
          {fieldErrors.notes && <p className="mt-1 text-sm text-terra-600">{fieldErrors.notes}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="p-hint" className="text-sm font-semibold">
            Подсказка <span className="font-normal text-espresso-500">— не обязательно</span>
          </label>
          <input
            id="p-hint"
            type="text"
            value={form.hint}
            onChange={(e) => set('hint', e.target.value)}
            placeholder="Для воронки и чёрного кофе без молока"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="p-weight" className="text-sm font-semibold">
            Вес
          </label>
          <input
            id="p-weight"
            type="text"
            value={form.weight}
            onChange={(e) => set('weight', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="p-price" className="text-sm font-semibold">
            Цена, BYN
          </label>
          <input
            id="p-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            className={inputCls}
          />
          {fieldErrors.price && <p className="mt-1 text-sm text-terra-600">{fieldErrors.price}</p>}
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => set('is_active', e.target.checked)}
              className="h-4 w-4 accent-espresso-900"
            />
            Показывать на сайте
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 rounded-full bg-espresso-900 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-espresso-800"
      >
        {initial ? 'Сохранить' : 'Добавить сорт'}
      </button>
    </form>
  );
}
