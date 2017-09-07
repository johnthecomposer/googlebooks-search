const books = (function($) {
     const url = 'https://www.googleapis.com/books/v1/volumes?q=';
     return {
          fetched: [],
          data: [this.fields],
          searchterms: {},
          querystring: '',
          searching: false,
          fields: {
               title: true,
               authors: true,
               publisher: true,
               description: true,
               // categories: true
               // ISBN: true,
               // LCCN: true,
               // OCLC: true
          },
          filters: [
               {name: 'title', param: 'intitle', placeholder: 'title', active: false},
               {name: 'authors', param: 'inauthor', placeholder: 'authors', active: false},
               // {name: 'description', param: 'indescription', placeholder: 'description', active: false},
               // {name: 'publisher', param: 'inpublisher', placeholder: 'publisher', active: false},
               // {name: 'category', param: 'subject', placeholder: 'category/subject', active: false},
               // {name: 'ISBN', param: 'isbn', placeholder: 'ISBN', active: false},
               // {name: 'LCCN', param: 'lccn', placeholder: 'LCCN', active: false}, // Library of Congress Control Number.
               // {name: 'OCLC', param: 'oclc', placeholder: 'OCLC', active: false}, // Online Computer Library Center number.
               {name: 'general', param: 'general', placeholder: 'all fields', active: false}
          ],
          searcharray: [],
          displayFilters: function(container_id){
               let container = $('#' + container_id);
               for(var f = 0; f < this.filters.length; f++){
                    let filter = this.filters[f];
                    let elm = $('<input>').
                         attr('data-filter-id', f).
                         prop('id', filter.name).
                         prop('name', filter.param).
                         prop('placeholder', '[' + filter.placeholder + ']').
                         prop('class', 'searchbox filter');
                    container.append(elm);
               }
          },
          buildQueryString: function(){
               this.querystring = typeof this.searchterms.general !== 'undefined' ? this.searchterms.general : '';
               for(f in this.searchterms){
                    if(f !== 'general'){
                         this.querystring += (this.querystring.length ? '+' : '') +
                                              f +
                                              ':' +
                                              this.searchterms[f];
                    }
               }
          },
          handleSearch: function(classname){
               $('.' + classname).keyup(function(){
                    var that = $(this);
                    setTimeout(function(){
                         books.searching ? books.searching.abort() : '';
                         books.searching = false;
                         let val = that.val().replace(/\s/g, '%20');
                         if(val.length > 1){
                              that.addClass('active');
                              books.searchterms[that.prop('name')] = val;
                         }
                         else{
                              that.removeClass('active');
                              delete books.searchterms[that.prop('name')];
                         }
                         if(books.searchterms){
                              books.buildQueryString();
                         }
                         if(books.querystring){
                              // get
                              books.get(books.querystring).
                                   then(function(response){
                                        console.log('response from GET request')
                                        console.log(response)
                                        // set data
                                        books.set(response);
                                        // destroy autocomplete instance if it exists
                                        books.reset('filters');
                                        // set autocomplete
                                        books.autocomplete('general');
                                        // show all items in source
                                        $('#general').autocomplete('search', '');
                              });
                         }
                    }, 700);
               });
          },
          // Source: https://developers.google.com/web/fundamentals/getting-started/primers/promises#promisifying_xmlhttprequest
          get: function(querystring){
               console.log('getting url: ' + url + querystring);
               return new Promise(function(resolve, reject) {
                    var req = new XMLHttpRequest();
                    this.searching = req;
                    req.open('GET', url + querystring);
                    req.onload = function(){
                         if(req.status == 200){
                              var parsed = JSON.parse(req.response);
                              resolve(parsed);
                         }
                         else{
                              reject(Error(req.statusText));
                         }
                    };
                    req.onerror = function(){
                         reject(Error('Network Error'));
                    };
                    req.send();
               });
          },
          set: function(data){
               this.fetched = data.items;
               this.data = this.fetched;
               for(book in this.data){
                    this.data[book] = this.data[book].volumeInfo;
                    let arr = [];
                    for(field in this.fields){
                         let val = this.data[book][field];
                         this.data[book][field] = Array.isArray(val) ? val.join(', ') : val;
                         // // if(Array.isArray(val)){
                         // //      //console.log(field)
                         // //      console.log(val.join(', '))
                         // //      val = val.join(', ');
                         // }
                         if(this.fields[field] && this.data[book].hasOwnProperty(field)){
                              arr.push(val);
                         }
                    }
                    this.searcharray.push({
                         label: arr.join(' | '),
                         value: this.searcharray.length
                    });
               }
          },
          reset: function(form_id){
               if(typeof $('#general').autocomplete('instance') !== 'undefined'){
                    $('#general').autocomplete('destroy');
               }
          },
          clear: function(form_id){
               $('#' + form_id + ' input').each(function(){
                    $(this).val('');
               });
          },
          autocomplete: function(id){
               $('#' + id).autocomplete({
                    minLength: 0,
                    // Source: https://stackoverflow.com/questions/28176552/jquery-ui-autocomplete-with-objects
                    source: function(request, response){
                         response($.map(books.data, function(value, key){
                              return {
                                   label: value.title,
                                   value: value.title,
                                   title: value.title,
                                   subtitle: value.subtitle,
                                   authors: value.authors,
                                   publisher: value.publisher,
                                   description: value.description,
                                   categories: value.categories,
                                   image: (typeof value.imageLinks !== 'undefined' ? value.imageLinks.thumbnail : '')
                              }
                         }));
                    },
                    open: function() {
                    },
                    change: function(event, ui){
                    },
                    close: function(event, ui){
                         $('.ui-menu').css('display', 'block');
                    },
                    appendTo: '#filters'
               }).
               data('ui-autocomplete')._renderItem = function(ul, item){
                    // TODO: add placeholder image for items without a thumbnail
                    let thumbnail = $('<img src="' + item.image + '" alt="' + item.value + '">').
                         addClass('book-thumbnail');
                    let info = $('<div></div>').
                         addClass('book-info').
                         append('<div class="book-title"' + (typeof item.title === 'undefined' ? 'hidden' : '') + '>' + item.title + '</div>').
                         append('<div class="book-subtitle"' + (typeof item.subtitle === 'undefined' ? 'hidden' : '') + '>' + item.subtitle + '</div>').
                         append('<div class="book-authors"' + (typeof item.authors === 'undefined' ? 'hidden' : '') + '><span>by ' + item.authors + '</span></div>').
                         append('<div class="book-description"' + (typeof item.description === 'undefined' ? 'hidden' : '') + '>' + item.description + '</div>');
                    return $('<li></li>').
                         addClass('flexcontainer').
                         //css('background-image', 'url("' + item.image + '")').
                         data('item.ui-autocomplete', item).
                              append(thumbnail).
                              append(info).
                              appendTo(ul);
               }
          }
     }
})($);

$(document).ready(function(){
     // render search fields
     books.displayFilters('filters');
     // handle search fields
     books.handleSearch('searchbox');
     // click handlers
     $('#reset').click(function(){
          books.reset('filters');
          books.clear('filters');
     });
});
