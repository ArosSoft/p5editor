import{s as l}from"./useAuth-RYdJnix_.js";import{r as k}from"./index-BuUWrgGT.js";function W(){const h=k([]),i=k(null),n=k(!1),o=k(null),g=k(0);async function w(t){try{n.value=!0,o.value=null;const{data:e,error:r}=await l.from("sketches").select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          ),
          sketch_moderation_logs (
            id,
            action,
            comment,
            created_at,
            profiles:moderator_id (
              display_name
            )
          )
        `,{count:"exact"}).eq("id",t).single();if(r)throw r;const c=e,a=c.sketch_moderation_logs||[],u=a.length>0?a.sort((s,m)=>new Date(m.created_at).getTime()-new Date(s.created_at).getTime())[0]:null,f={...c,moderation_log:u?{action:u.action,comment:u.comment,moderator_name:u.profiles?.display_name||"Модератор",created_at:u.created_at}:null};return i.value=f,{success:!0,data:f}}catch(e){return o.value=e instanceof Error?e.message:"Ошибка загрузки скетча",console.error("Get sketch error:",e),{success:!1,error:o.value}}finally{n.value=!1}}async function y({page:t=1,limit:e=12,category:r,difficulty:c,search:a,sortBy:u="created_at",sortOrder:f="desc"}={}){try{n.value=!0,o.value=null;let s=l.from("sketches").select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `,{count:"exact"}).eq("status","approved");r&&(s=s.eq("category",r)),c&&(s=s.eq("difficulty",c)),a&&(s=s.or(`title.ilike.%${a}%,description.ilike.%${a}%`));const d={popular:"likes",new:"created_at",title:"title",views:"views",created_at:"created_at"}[u]||"created_at";s=s.order(d,{ascending:f==="asc"});const v=(t-1)*e,_=v+e-1;s=s.range(v,_);const b=s,B=new Promise(($,U)=>{setTimeout(()=>U(new Error("Таймаут запроса (5 секунд)")),5e3)}),{data:H,error:p,count:R}=await Promise.race([b,B]);if(p)throw p;return h.value=H||[],g.value=R||0,{success:!0,data:h.value,total:g.value}}catch(s){return o.value=s instanceof Error?s.message:"Ошибка загрузки галереи",console.error("Get gallery sketches error:",s),{success:!1,error:o.value}}finally{n.value=!1}}async function E(t,e){try{n.value=!0,o.value=null;let r=l.from("sketches").select(`
          *,
          sketch_moderation_logs (
            id,
            action,
            comment,
            created_at,
            profiles:moderator_id (
              display_name
            )
          )
        `).eq("user_id",t).order("created_at",{ascending:!1});e&&(r=r.eq("status",e));const{data:c,error:a}=await r;if(a)throw a;return h.value=(c||[]).map(u=>{const f=u.sketch_moderation_logs||[],s=f.length>0?f.sort((m,d)=>new Date(d.created_at).getTime()-new Date(m.created_at).getTime())[0]:null;return{...u,moderation_log:s?{action:s.action,comment:s.comment,moderator_name:s.profiles?.display_name||"Модератор",created_at:s.created_at}:null}}),{success:!0,data:h.value}}catch(r){return o.value=r instanceof Error?r.message:"Ошибка загрузки скетчей пользователя",console.error("Get user sketches error:",r),{success:!1,error:o.value}}finally{n.value=!1}}async function S(t){try{n.value=!0,o.value=null;const e=l.from("sketches").insert(t).select().single(),r=new Promise((u,f)=>{setTimeout(()=>f(new Error("Таймаут создания скетча (15 секунд)")),15e3)}),{data:c,error:a}=await Promise.race([e,r]);if(a)throw a;return{success:!0,data:c}}catch(e){return o.value=e instanceof Error?e.message:"Ошибка создания скетча",console.error("Create sketch error:",e),{success:!1,error:o.value}}finally{n.value=!1}}async function q(t,e){try{n.value=!0,o.value=null;const{data:r,error:c}=await l.from("sketches").update(e).eq("id",t).select().single();if(c)throw c;return i.value?.id===t&&(i.value=r),{success:!0,data:r}}catch(r){return o.value=r instanceof Error?r.message:"Ошибка обновления скетча",console.error("Update sketch error:",r),{success:!1,error:o.value}}finally{n.value=!1}}async function j(t){try{n.value=!0,o.value=null;const{error:e}=await l.from("sketches").delete().eq("id",t);if(e)throw e;return h.value=h.value.filter(r=>r.id!==t),{success:!0}}catch(e){return o.value=e instanceof Error?e.message:"Ошибка удаления скетча",console.error("Delete sketch error:",e),{success:!1,error:o.value}}finally{n.value=!1}}async function P(t){try{if(i.value?.id===t){const{data:e,error:r}=await l.from("sketches").update({views:i.value.views+1}).eq("id",t).select().single();if(r)throw r;i.value=e}return{success:!0}}catch(e){return console.error("Increment views error:",e),{success:!1,error:e instanceof Error?e.message:"Ошибка увеличения просмотров"}}}async function D(t,e){try{n.value=!0,o.value=null;const{data:r,error:c}=await l.from("sketch_likes").select("id").eq("sketch_id",t).eq("user_id",e).maybeSingle();if(c)throw c;if(r){const{error:a}=await l.from("sketch_likes").delete().eq("id",r.id);if(a)throw a;return i.value?.id===t&&(i.value={...i.value,likes:Math.max(0,i.value.likes-1)}),{success:!0,liked:!1}}else{const{error:a}=await l.from("sketch_likes").insert({sketch_id:t,user_id:e});if(a)throw a;return i.value?.id===t&&(i.value={...i.value,likes:i.value.likes+1}),{success:!0,liked:!0}}}catch(r){return o.value=r instanceof Error?r.message:"Ошибка лайка",console.error("Toggle like error:",r),{success:!1,error:o.value}}finally{n.value=!1}}async function T(t,e){try{const{data:r}=await l.from("sketch_likes").select("id").eq("sketch_id",t).eq("user_id",e).maybeSingle();return{success:!0,liked:!!r}}catch{return{success:!1,liked:!1}}}async function G(){try{const{data:t,error:e}=await l.from("sketches").select("category").eq("status","approved").not("category","is",null);if(e)throw e;return{success:!0,categories:[...new Set((t||[]).map(c=>c.category).filter(Boolean))]}}catch(t){return console.error("Get categories error:",t),{success:!1,categories:[]}}}async function L(){try{n.value=!0,o.value=null;const{data:t,error:e}=await l.from("sketches").select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("status","pending").order("created_at",{ascending:!1});if(e)throw e;return h.value=t||[],{success:!0,data:h.value}}catch(t){return o.value=t instanceof Error?t.message:"Ошибка загрузки скетчей на модерацию",console.error("Get pending sketches error:",t),{success:!1,error:o.value}}finally{n.value=!1}}async function M(t,e,r){try{n.value=!0,o.value=null,console.log("[approveSketch] Начало одобрения скетча:",t);const c=l.from("sketches").update({status:"approved"}).eq("id",t).select().single(),a=new Promise((s,m)=>{setTimeout(()=>m(new Error("Таймаут одобрения скетча (15 секунд)")),15e3)}),{data:u,error:f}=await Promise.race([c,a]);if(f)throw console.error("[approveSketch] Ошибка обновления скетча:",f),f;if(console.log("[approveSketch] Скетч одобрен успешно"),e)try{const{error:s}=await l.from("sketch_moderation_logs").insert({sketch_id:t,moderator_id:e,action:"approved",comment:r||null});s&&console.warn("[approveSketch] Не удалось сохранить лог модерации:",s)}catch(s){console.warn("[approveSketch] Исключение при логировании:",s)}return{success:!0,data:u}}catch(c){return o.value=c instanceof Error?c.message:"Ошибка одобрения скетча",console.error("[approveSketch] Approve sketch error:",c),{success:!1,error:o.value}}finally{n.value=!1}}async function C(t,e,r){try{n.value=!0,o.value=null,console.log("[rejectSketch] Начало отклонения скетча:",t),console.log("[rejectSketch] Moderator ID:",e),console.log("[rejectSketch] Причина:",r);const{data:c,error:a}=await l.from("sketches").select("id, status, user_id").eq("id",t).single();if(a)throw console.error("[rejectSketch] Ошибка проверки скетча:",a),a.code==="400"||a.code==="401"||a.code==="403"?new Error("Нет прав доступа к скетчу. Проверьте RLS политики."):a;console.log("[rejectSketch] Скетч найден:",c);const u={status:"rejected"},f=l.from("sketches").update(u).eq("id",t).select().single(),s=new Promise((v,_)=>{setTimeout(()=>_(new Error("Таймаут отклонения скетча (15 секунд)")),15e3)}),{data:m,error:d}=await Promise.race([f,s]);if(d)throw console.error("[rejectSketch] Ошибка обновления скетча:",d),"details"in d&&console.error("[rejectSketch] Details:",d.details),"hint"in d&&console.error("[rejectSketch] Hint:",d.hint),"message"in d&&console.error("[rejectSketch] Message:",d.message),d;if(console.log("[rejectSketch] Скетч отклонён успешно"),e)try{const{error:v}=await l.from("sketch_moderation_logs").insert({sketch_id:t,moderator_id:e,action:"rejected",comment:r});v?console.warn("[rejectSketch] Не удалось сохранить лог модерации:",v):console.log("[rejectSketch] Лог модерации сохранён")}catch(v){console.warn("[rejectSketch] Исключение при логировании:",v)}return{success:!0,data:m}}catch(c){const a=c instanceof Error?c.message:"Ошибка отклонения скетча";return o.value=a,console.error("[rejectSketch] Reject sketch error:",c),{success:!1,error:a}}finally{n.value=!1}}async function x(t){try{const{data:e,error:r}=await l.from("sketch_moderation_logs").select(`
          *,
          profiles:moderator_id (
            id,
            display_name,
            avatar_url
          )
        `).eq("sketch_id",t).order("created_at",{ascending:!1});if(r)throw r;return{success:!0,data:e||[]}}catch(e){return console.error("Get moderation history error:",e),{success:!1,error:e instanceof Error?e.message:"Ошибка загрузки истории"}}}return{sketches:h,sketch:i,loading:n,error:o,total:g,getSketchById:w,getGallerySketches:y,getUserSketches:E,createSketch:S,updateSketch:q,deleteSketch:j,incrementViews:P,toggleLike:D,checkLike:T,getCategories:G,getPendingSketches:L,approveSketch:M,rejectSketch:C,getSketchModerationHistory:x}}export{W as u};
