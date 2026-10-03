-- MIZ Loja · primeira Admin Miz (conta do time Miz que já existe no Auth)
insert into public.mizloja_admins (id, nome)
select u.id, 'Admin MIZ'
from auth.users u
where lower(u.email) = 'usemizdigital@gmail.com'
on conflict (id) do nothing;
