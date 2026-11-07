import { test, expect } from '@playwright/test';
const admin = { id: 'test-admin', role: 'admin', name: 'Test admin', email: 'test@example.com', accessToken: 'browser-test-token' };
function fixtures() { return Array.from({length:27}, (_,i) => ({ id:`prop_${i}`, title:`${['Hoodi Garden','Whitefield Park','Bellandur Lake'][i%3]} Home ${i+1}`, location:`${['Hoodi','Whitefield','Bellandur'][i%3]}, Bengaluru`, locality:['Hoodi','Whitefield','Bellandur'][i%3], price:30000+i*1000, status:i%2?'buy':'rent', category:'apartment', bedrooms:2+i%3, bathrooms:2, areaSqft:1000+i*50, description:'A spacious test home', images:['/src/assets/no-image.png'], videos:[], amenities:['Parking'], isActive:true, featured:false, verified:true, createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z' })); }
async function setup(page: import('@playwright/test').Page, authenticated=false) {
  const rows=fixtures(); const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({authenticated,admin}) => { sessionStorage.setItem('nova-visited','1'); if(authenticated) localStorage.setItem('estate_auth_user',JSON.stringify(admin)); }, {authenticated,admin});
  await page.route('**/api/**', async route => {
    const url=new URL(route.request().url()); const path=url.pathname;
    let body: unknown = {};
    if(path.endsWith('/public/storage/properties')) body=rows.filter(p=>p.isActive);
    else if(path.endsWith('/auth/me')) body={user:admin};
    else if(path.endsWith('/storage/object') && route.request().method()==='GET') body={content:JSON.stringify(rows)};
    else if(path.includes('/storage/properties/')) {
      const id=path.split('/').pop(); const input=route.request().postDataJSON(); const row=rows.find(p=>p.id===id)!;
      Object.assign(row,input.input,{updatedAt:new Date().toISOString()}); if(input.operation==='archive') Object.assign(row,{archivedAt:new Date().toISOString(),isActive:false}); if(input.operation==='restore') Object.assign(row,{archivedAt:undefined,isActive:false});
      body={property:row};
    } else if(path.endsWith('/crm/leads')) body={leads:[],total:0,page:1,pageSize:5};
    else if(path.endsWith('/public/leads')) body={id:'test-enquiry'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  return {rows,errors};
}
test('search applies explicitly, filters compose and a shared URL restores them',async({page})=>{
  const {errors}=await setup(page); await page.goto('/properties');
  await expect(page.getByRole('heading',{name:'Browse Properties'})).toBeVisible();
  await expect(page.getByText('27 properties found',{exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Enter a locality, address or property name'}).fill('Hoodi');
  await expect(page.getByText('27 properties found',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Search listings',exact:true}).click();
  await expect(page.getByText('9 properties found',{exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Sale or rent'}).selectOption('rent');
  await expect(page.getByText('5 properties found',{exact:true})).toBeVisible();
  await expect(page).toHaveURL(/status=rent/); await page.goBack(); await expect(page.getByText('9 properties found',{exact:true})).toBeVisible(); await page.goForward(); await expect(page.getByText('5 properties found',{exact:true})).toBeVisible(); const url=page.url(); await page.goto(url);
  await expect(page.getByText('5 properties found',{exact:true})).toBeVisible(); expect(errors).toEqual([]);
});
test('shortlists, comparison and pagination are usable without an account',async({page})=>{
  const {errors}=await setup(page); await page.goto('/properties');
  await expect(page.getByRole('button',{name:'Next',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save property',exact:true}).first().click();
  await page.getByRole('button',{name:'Compare',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'Compare properties (1/3)'})).toBeVisible();
  await page.getByRole('button',{name:'Shortlisted (1)',exact:true}).click();
  await expect(page.getByText('1 property found',{exact:true})).toBeVisible();
  await page.reload(); await expect(page.getByRole('button',{name:'Shortlisted (1)',exact:true})).toBeVisible(); expect(errors).toEqual([]);
});
test('admin counts, BHK, size and archive/restore reflect saved changes',async({page})=>{
  const {errors}=await setup(page,true); await page.goto('/admin/manage-properties');
  await expect(page.getByRole('heading',{name:'Manage Properties'})).toBeVisible();
  await page.getByRole('combobox',{name:'Sale or rent'}).selectOption('rent');
  await expect(page.getByText('14 rental properties of 27 total',{exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'BHK',exact:true}).selectOption('2');
  await expect(page.getByText('5 rental properties of 27 total',{exact:true})).toBeVisible();
  await page.getByRole('spinbutton',{name:'Minimum size in square feet'}).fill('2000');
  await expect(page.getByText('1 rental property of 27 total',{exact:true})).toBeVisible();
  await page.getByRole('spinbutton',{name:'Minimum size in square feet'}).fill('');
  page.on('dialog',d=>void d.accept());
  const archive=page.getByRole('button',{name:'Archive property',exact:true});
  if(await archive.count()) await archive.first().click(); else await page.getByRole('button',{name:'Archive',exact:true}).first().click();
  await expect(page.getByText('4 rental properties of 27 total',{exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Visibility',exact:true}).selectOption('archived');
  await expect(page.getByText('1 rental property of 27 total',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Restore property|^Restore$/}).first().click();
  await expect(page.getByText('0 rental properties of 27 total',{exact:true})).toBeVisible(); expect(errors).toEqual([]);
});
test('mobile and desktop pages fit their viewport',async({page},testInfo)=>{
  await setup(page); await page.goto('/properties'); await expect(page.getByRole('heading',{name:'Browse Properties'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBeTruthy();
  await page.screenshot({path:testInfo.outputPath('browse.png'),fullPage:false});
});

test('dirty property edits prompt before navigation and can be recovered',async({page})=>{
  await setup(page,true); await page.goto('/admin/manage-properties');
  await page.getByRole('button',{name:/^Edit property$|^Edit$/}).first().click();
  const title=page.getByRole('textbox',{name:'Property Title',exact:true}); await expect(title).toBeVisible();
  await title.fill('Unfinished browser draft');
  page.once('dialog',dialog=>void dialog.accept());
  if (page.viewportSize()!.width < 768) await page.getByRole('button',{name:'Open admin menu'}).click();
  await page.getByRole('button',{name:/Manage Prope/}).click();
  await page.getByRole('button',{name:/^Edit property$|^Edit$/}).first().click();
  await expect(page.getByRole('button',{name:'Restore draft',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Restore draft',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Property Title',exact:true})).toHaveValue('Unfinished browser draft');
});
