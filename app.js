const rangesContainer = document.getElementById("ranges");
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");

// تبدیل اعداد انگلیسی به فارسی
function toPersianDigits(str) {
  return (str + "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function createRangeItem(rangeData = null) {
  const fileId = crypto.randomUUID();
  const div = document.createElement("div");
  div.className = "range-item";
  div.innerHTML = `
  <div class="range-header my-2">
    <div class="flex gap-2">
      <input type="text" class="border rounded p-1 w-36 range-name" placeholder="عنوان مبحث">
      <input data-number-input="true" data-float="false" class="border rounded p-1 range-count" placeholder="تعداد سوال از مبحث">
      <div class="file-input">
      <input type="file" id="file" accept="image/*" multiple class="file range-images">
      <label for="file" class="btn px-4 py-2 rounded">
      <i class="bi bi-upload"></i>
      <span class="mx-2">
      آپلود تصویر سوال
      </span>
      </label>
      </div>
    </div>
    <div class="flex items-center gap-2">
    <span class="range-total"></span>
    <button class="btn px-2 py-1 bg-red-500 text-white rounded remove-range">
    <i class="bi bi-trash3"></i>
    </button>
      </div>
    </div>   

    <div class="preview"></div>
  `;

  const previewDiv = div.querySelector(".preview");
  const fileInput = div.querySelector(".range-images");
  const totalSpan = div.querySelector(".range-total");
  const images = [];

  if (rangeData) {
    div.querySelector(".range-name").value = rangeData.rangeName;
    div.querySelector(".range-count").value = rangeData.count;
    rangeData.images.forEach((imgSrc) => addImage(imgSrc));
  }

  function addImage(imgSrc) {
    images.push(imgSrc);
    const imgContainer = document.createElement("div");
    imgContainer.innerHTML = `<img src="${imgSrc}" alt=""><button>&times;</button>`;
    imgContainer.querySelector("button").onclick = () => {
      const index = images.indexOf(imgSrc);
      if (index > -1) images.splice(index, 1);
      imgContainer.remove();
      totalSpan.textContent = `${toPersianDigits(images.length)} سوال`;
    };
    imgContainer.querySelector("img").onclick = () => {
      modalImg.src = imgSrc;
      modal.style.display = "flex";
    };
    previewDiv.appendChild(imgContainer);
    totalSpan.textContent = `${toPersianDigits(images.length)} سوال`;
  }

  fileInput.addEventListener("change", (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => addImage(ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  });

  // پشتیبانی از Paste
  div.addEventListener("paste", (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => addImage(ev.target.result);
        reader.readAsDataURL(blob);
      }
    }
  });

  div.querySelector(".remove-range").onclick = () => div.remove();
  return div;
}

document.getElementById("addRange").onclick = () => {
  rangesContainer.appendChild(createRangeItem());
};
modal.addEventListener("click", () => {
  modal.style.display = "none";
  modalImg.src = "";
});

document.getElementById("generate").onclick = (e) => {
  generateTable();
  e.target.scrollIntoView({ behavior: "smooth" });
};

function generateTable() {
  const names = document
    .getElementById("names")
    .value.trim()
    .split("\n")
    .filter((n) => n);
  const rangeDivs = document.querySelectorAll(".range-item");
  if (!names.length || !rangeDivs.length) {
    alert("لطفا همه‌ی فیلدها را پر کنید");
    return;
  }

  const ranges = [];
  rangeDivs.forEach((div) => {
    const rangeName = div.querySelector(".range-name").value.trim();
    const count = parseInt(div.querySelector(".range-count").value);
    const imgs = Array.from(div.querySelectorAll(".preview img")).map(
      (i) => i.src
    );
    if (!rangeName || !count || imgs.length === 0) {
      alert("لطفا محدوده‌ها کامل باشد");
      return;
    }
    ranges.push({ rangeName: rangeName, count: count, images: imgs });
  });

  let finalData = {};
  names.forEach((n) => (finalData[n] = []));

  ranges.forEach((r) => {
    const shuffled = [...r.images].sort(() => Math.random() - 0.5);
    const numStudents = names.length;
    const numQuestions = r.count;

    if (numQuestions >= shuffled.length) {
      names.forEach((student) => {
        const selection = [];
        const pool = [...shuffled];
        for (let i = 0; i < r.count; i++) {
          if (pool.length === 0) break;
          const idx = Math.floor(Math.random() * pool.length);
          selection.push(pool[idx]);
          pool.splice(idx, 1);
        }
        finalData[student].push({ rangeName: r.rangeName, images: selection });
      });
    } else {
      const pool = [...shuffled];
      names.forEach((student) => {
        const selection = [];
        for (let i = 0; i < r.count; i++) {
          if (pool.length === 0) pool.push(...shuffled);
          const idx = Math.floor(Math.random() * pool.length);
          selection.push(pool[idx]);
          pool.splice(idx, 1);
        }
        finalData[student].push({ rangeName: r.rangeName, images: selection });
      });
    }
  });

  let html = `<table><thead><tr><th>نام دانش‌آموز</th><th>سوال‌ها</th></tr></thead><tbody>`;
  names.forEach((student) => {
    let questionHtml = "<table>";
    let qNum = 1;
    finalData[student].forEach((r) => {
      r.images.forEach((img) => {
        questionHtml += `<tr><td style="width:40px;text-align:center;font-weight:bold;">${toPersianDigits(
          qNum
        )}</td><td><img src="${img}" alt="${r.rangeName}"></td></tr>`;
        qNum++;
      });
    });
    questionHtml += "</table>";
    html += `<tr><td class="student">${student}</td><td class="questions">${questionHtml}</td></tr>`;
  });
  html += "</tbody></table>";
  document.getElementById("printable").innerHTML = html;
}

// Export JSON
document.getElementById("exportJson").onclick = () => {
  const names = document
    .getElementById("names")
    .value.trim()
    .split("\n")
    .filter((n) => n);
  const ranges = Array.from(document.querySelectorAll(".range-item")).map(
    (div) => {
      return {
        rangeName: div.querySelector(".range-name").value,
        count: parseInt(div.querySelector(".range-count").value),
        images: Array.from(div.querySelectorAll(".preview img")).map(
          (i) => i.src
        ),
      };
    }
  );
  const data = { names, ranges };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.json";
  a.click();
};

// Import JSON
document.getElementById("importJsonBtn").onclick = () =>
  document.getElementById("importJson").click();
document.getElementById("importJson").addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (ev) => {
    const data = JSON.parse(ev.target.result);
    document.getElementById("names").value = data.names.join("\n");
    rangesContainer.innerHTML = "";
    data.ranges.forEach((r) => rangesContainer.appendChild(createRangeItem(r)));
  };
  reader.readAsText(file);
  e.target.value = "";
});
